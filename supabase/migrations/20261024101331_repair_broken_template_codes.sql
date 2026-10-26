-- Repair skill template codes corrupted by the encoder bit-width bug.
-- @buildwars/gw-templates sized skill fields too small when a bar held a skill
-- id >= 2048 (fixed in lib/gw/template-pad.ts), so the stored `template` of
-- those bars decodes to wrong skills from that slot onward. The stored
-- `skills` arrays are correct, so each broken code is rebuilt from them: the
-- header (professions + attributes) is kept bit-for-bit and only the skill
-- section is rewritten with the correct width.
--
-- Run ONLY after the encoder fix is deployed, otherwise new broken codes can
-- appear in between. Idempotent: only rows whose template disagrees with their
-- stored skills are touched, so re-running repairs anything created meanwhile.
-- Aborts (rolls back everything) if any repaired code fails to decode back to
-- its stored skills or changes its header.
-- Dry run on prod 2026-10-24 (read-only): 495 bar/variant codes in 351 live
-- builds; only `template` fields change, and a second pass changes nothing.

-- Template bitstring: base64 chars, 6 bits each, least significant bit first
create function pg_temp.tpl_bits(tpl text) returns text language sql immutable as $$
  select string_agg(reverse(((strpos('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', c) - 1)::bit(6))::text), '' order by i)
  from regexp_split_to_table(regexp_replace(tpl, '[^A-Za-z0-9+/]', '', 'g'), '') with ordinality t(c, i)
$$;

-- Read an n-bit little-endian field at 1-based bit position pos
create function pg_temp.tpl_read(b text, pos int, n int) returns int language sql immutable as $$
  select coalesce(sum(((substr(b, pos + k, 1) = '1')::int) << k), 0)::int from generate_series(0, n - 1) k
$$;

create function pg_temp.tpl_write(v int, n int) returns text language sql immutable as $$
  select string_agg(((v >> k) & 1)::text, '' order by k) from generate_series(0, n - 1) k
$$;

-- Bits before the skill section (type, version, professions, attributes)
create function pg_temp.tpl_header(tpl text) returns text language plpgsql immutable as $$
declare b text := pg_temp.tpl_bits(tpl); pos int := 9; pb int; ac int; ab int;
begin
  pb := pg_temp.tpl_read(b, pos, 2) * 2 + 4;
  pos := pos + 2 + 2 * pb;
  ac := pg_temp.tpl_read(b, pos, 4);
  ab := pg_temp.tpl_read(b, pos + 4, 4) + 4;
  return substring(b from 1 for pos + 8 + ac * (ab + 4) - 1);
end $$;

-- Decoded skill ids as 'a,b,c,...' (new-format templates only, type 14)
create function pg_temp.tpl_skills(tpl text) returns text language plpgsql immutable as $$
declare b text := pg_temp.tpl_bits(tpl); pos int; sb int; res text := ''; k int;
begin
  if pg_temp.tpl_read(b, 1, 4) <> 14 then return null; end if;
  pos := length(pg_temp.tpl_header(tpl)) + 1;
  sb := pg_temp.tpl_read(b, pos, 4) + 8;
  pos := pos + 4;
  for k in 0..7 loop
    res := res || case when k > 0 then ',' else '' end || pg_temp.tpl_read(b, pos + k * sb, sb);
  end loop;
  return res;
end $$;

create function pg_temp.tpl_reencode(tpl text, skills int[]) returns text language plpgsql immutable as $$
declare out text; sb int; k int; res text := '';
begin
  select greatest(10, max(length(ltrim(s::bit(16)::text, '0')))) into sb from unnest(skills) s;
  out := pg_temp.tpl_header(tpl) || pg_temp.tpl_write(sb - 8, 4);
  for k in 1..8 loop out := out || pg_temp.tpl_write(skills[k], sb); end loop;
  -- Same padding as the library (to a multiple of 8, then 6-bit chars), so
  -- the result is byte-identical to what the fixed app encoder produces
  out := rpad(out, ((length(out) + 7) / 8) * 8, '0');
  out := rpad(out, ((length(out) + 5) / 6) * 6, '0');
  for k in 0..(length(out) / 6 - 1) loop
    res := res || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', pg_temp.tpl_read(out, k * 6 + 1, 6) + 1, 1);
  end loop;
  return res;
end $$;

-- Fixed code for one bar/variant json object, or null if it needs no repair
create function pg_temp.tpl_fix(obj jsonb) returns text language plpgsql immutable as $$
declare tpl text := obj->>'template'; skills int[]; fixed text;
begin
  if coalesce(tpl, '') = '' or jsonb_typeof(obj->'skills') <> 'array' then return null; end if;
  select array_agg(s::int order by o) into skills from jsonb_array_elements_text(obj->'skills') with ordinality x(s, o);
  if array_length(skills, 1) <> 8 then return null; end if;
  if pg_temp.tpl_skills(tpl) is null or pg_temp.tpl_skills(tpl) = array_to_string(skills, ',') then return null; end if;
  fixed := pg_temp.tpl_reencode(tpl, skills);
  if pg_temp.tpl_skills(fixed) is distinct from array_to_string(skills, ',')
     or pg_temp.tpl_header(fixed) <> pg_temp.tpl_header(tpl) then
    raise exception 'template repair self-check failed for %', tpl;
  end if;
  return fixed;
end $$;

-- Keep updated_at as is: this is a data repair, not a user edit
alter table public.builds disable trigger builds_updated_at;

do $$
declare
  r record; new_bars jsonb; fixed text; i int; j int; codes int := 0; n_builds int := 0;
begin
  for r in select b.id, b.bars from public.builds b where deleted_at is null loop
    new_bars := r.bars;
    for i in 0..jsonb_array_length(new_bars) - 1 loop
      fixed := pg_temp.tpl_fix(new_bars->i);
      if fixed is not null then
        new_bars := jsonb_set(new_bars, array[i::text, 'template'], to_jsonb(fixed));
        codes := codes + 1;
      end if;
      if jsonb_typeof(new_bars->i->'variants') = 'array' then
        for j in 0..jsonb_array_length(new_bars->i->'variants') - 1 loop
          fixed := pg_temp.tpl_fix(new_bars->i->'variants'->j);
          if fixed is not null then
            new_bars := jsonb_set(new_bars, array[i::text, 'variants', j::text, 'template'], to_jsonb(fixed));
            codes := codes + 1;
          end if;
        end loop;
      end if;
    end loop;
    if new_bars is distinct from r.bars then
      update public.builds set bars = new_bars where id = r.id;
      n_builds := n_builds + 1;
    end if;
  end loop;
  raise notice 'repaired % template codes in % builds', codes, n_builds;
end $$;

alter table public.builds enable trigger builds_updated_at;
