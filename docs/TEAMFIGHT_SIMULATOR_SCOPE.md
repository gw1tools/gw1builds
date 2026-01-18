# GW1 Teamfight Simulator - Scope & Architecture Plan

**Version:** 1.0
**Date:** January 2026
**Status:** Initial Scoping

---

## Executive Summary

Building a GW1 teamfight simulator is a **massive undertaking**. With 1,484 skills, each with unique mechanics, conditions, triggers, and interactions, this is comparable to building a small MMO combat system.

**Estimated Complexity:** Very High
**Skill Implementation Estimate:** 150-300+ person-days (with 20 Claude instances)
**Core Engine Estimate:** 50-100 person-days
**Total Realistic Timeline:** 3-6 months with parallel Claude instances

---

## Table of Contents

1. [Skill Data Analysis](#skill-data-analysis)
2. [Combat System Architecture](#combat-system-architecture)
3. [Skill Effect Categories](#skill-effect-categories)
4. [Implementation Challenges](#implementation-challenges)
5. [Phased Implementation Plan](#phased-implementation-plan)
6. [Claude Army Strategy](#claude-army-strategy)
7. [Technical Architecture](#technical-architecture)
8. [Risk Assessment](#risk-assessment)

---

## Skill Data Analysis

### Raw Numbers

```
Total Skills:          1,484
Professions:           10
Skill Types:           32
Attributes:            45
Conditions:            ~12
```

### Skill Distribution by Type

```
┌─────────────────────────────────────────────────────────────┐
│ SKILL TYPES (32 categories, grouped)                        │
├─────────────────────────────────────────────────────────────┤
│ Spells           ~40%  ████████████████████                 │
│ Attacks          ~25%  ████████████                         │
│ Enchantments     ~15%  ███████                              │
│ Hexes            ~10%  █████                                │
│ Signets          ~5%   ██                                   │
│ Other (Stances,  ~5%   ██                                   │
│   Shouts, etc.)                                             │
└─────────────────────────────────────────────────────────────┘
```

### Skill Complexity Tiers

Based on analysis of skill descriptions:

| Tier | Complexity | Count | Examples |
|------|------------|-------|----------|
| S | Extreme | ~100 | Shadow Form, Spiteful Spirit, Discord |
| A | High | ~300 | Interrupts with conditionals, chain attacks |
| B | Medium | ~500 | Standard hexes, enchantments with triggers |
| C | Low | ~400 | Simple damage, basic heals, buffs |
| D | Trivial | ~184 | Single-effect skills, signets |

---

## Combat System Architecture

### Core Simulation Loop

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BATTLE SIMULATION ENGINE                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  TICK SYSTEM (100ms ticks, deterministic)                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Each Tick:                                                        │  │
│  │  1. Process queued actions (FIFO)                                 │  │
│  │  2. Update all active effects (buffs, hexes, dots)                │  │
│  │  3. Apply regeneration/degeneration                               │  │
│  │  4. Check death conditions                                        │  │
│  │  5. Trigger "on tick" effects                                     │  │
│  │  6. Update cooldowns/recharges                                    │  │
│  │  7. AI decision making (if applicable)                            │  │
│  │  8. Queue new actions                                             │  │
│  │  9. Record state delta for replay                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Entity State Model

```typescript
interface Unit {
  id: string
  teamId: 'a' | 'b'
  position: Vector2          // 2D arena position
  facing: number             // Direction in radians

  // Core stats
  health: number             // Current HP
  maxHealth: number          // Max HP (base 480 at level 20)
  energy: number             // Current energy
  maxEnergy: number          // Max energy (varies by profession)

  // Professions & Attributes
  primaryProfession: Profession
  secondaryProfession: Profession | null
  attributes: Record<AttributeId, number>  // 0-16 per attribute

  // Skills
  skillBar: SkillSlot[]      // 8 slots

  // Active effects
  enchantments: ActiveEffect[]
  hexes: ActiveEffect[]
  conditions: ActiveCondition[]
  stances: ActiveStance | null  // Only one stance at a time

  // State
  isCasting: boolean
  castingSkill: SkillId | null
  castProgress: number       // 0-1 progress
  isAttacking: boolean
  attackCooldown: number
  isKnockedDown: boolean
  knockdownRemaining: number
  isMoving: boolean
  moveTarget: Vector2 | null

  // Combat modifiers
  armorBonus: number
  damageModifier: number
  speedModifier: number
  blockChance: number
}
```

### Arena Layout (6v6)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BATTLE ARENA                                   │
│                        (800 x 600 units)                                │
│                                                                          │
│     TEAM A (Left)                              TEAM B (Right)            │
│                                                                          │
│         [A1]                                              [B1]           │
│              [A2]                                    [B2]                │
│                   [A3]                          [B3]                     │
│                   [A4]                          [B4]                     │
│              [A5]                                    [B5]                │
│         [A6]                                              [B6]           │
│                                                                          │
│  ───────────────────────────────────────────────────────────────────    │
│  Spawn Zone A          Center Line             Spawn Zone B              │
│                                                                          │
│  Typical Ranges:                                                         │
│  - Melee: ~50 units (adjacent)                                          │
│  - Touch: ~100 units                                                     │
│  - Nearby: ~150 units                                                    │
│  - Earshot: ~300 units                                                   │
│  - Spell Range: ~400 units (standard)                                    │
│  - Longbow: ~600 units                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Skill Effect Categories

Every skill needs to be implemented. Here's the categorization of all effects found:

### Category 1: Direct Effects (~400 skills)

```
┌─────────────────────────────────────────────────────────────┐
│ DIRECT EFFECTS - Immediate, single application              │
├─────────────────────────────────────────────────────────────┤
│ • Direct damage (physical, elemental, holy, shadow, chaos)  │
│ • Direct healing                                            │
│ • Energy gain/loss                                          │
│ • Adrenaline gain/loss                                      │
│ • Health sacrifice (Necromancer)                            │
│ • Resurrection                                              │
│ • Knockdown (duration varies)                               │
│ • Interrupt                                                 │
│ • Enchantment removal                                       │
│ • Hex removal                                               │
│ • Condition removal                                         │
│ • Condition transfer                                        │
└─────────────────────────────────────────────────────────────┘
```

### Category 2: Conditions (~100 skills apply these)

```
┌─────────────────────────────────────────────────────────────┐
│ CONDITIONS - Negative physical effects                      │
├─────────────────────────────────────────────────────────────┤
│ Condition      │ Effect                                     │
├────────────────┼────────────────────────────────────────────┤
│ Bleeding       │ -3 health degeneration                     │
│ Burning        │ -7 health degeneration, fire damage tick   │
│ Poison         │ -4 health degeneration                     │
│ Disease        │ -4 health degeneration, spreads to nearby  │
│ Weakness       │ -1 attribute, attack damage reduced        │
│ Blindness      │ 90% miss chance for attacks                │
│ Crippled       │ 50% movement speed reduction               │
│ Dazed          │ Double cast time, easily interrupted       │
│ Deep Wound     │ -20% max health, healing -20%              │
│ Cracked Armor  │ -20 armor                                  │
└─────────────────────────────────────────────────────────────┘
```

### Category 3: Timed Effects (~600 skills)

```
┌─────────────────────────────────────────────────────────────┐
│ TIMED EFFECTS - Duration-based modifications                │
├─────────────────────────────────────────────────────────────┤
│ ENCHANTMENTS (positive, on self/allies):                    │
│ • Stat modifiers (armor, damage, speed)                     │
│ • Regeneration effects                                      │
│ • Blocking/evade bonuses                                    │
│ • "When hit" triggers                                       │
│ • "When attacking" triggers                                 │
│ • Energy upkeep costs                                       │
│ • Maintained (end when caster wants)                        │
│                                                             │
│ HEXES (negative, on enemies):                               │
│ • Degeneration effects                                      │
│ • Stat reductions                                           │
│ • "When X happens" damage triggers                          │
│ • Skill disabling                                           │
│ • Movement impairment                                       │
│                                                             │
│ STANCES (self-only, one at a time):                         │
│ • Blocking bonuses                                          │
│ • Attack speed bonuses                                      │
│ • Movement bonuses                                          │
│ • "When attacked" effects                                   │
└─────────────────────────────────────────────────────────────┘
```

### Category 4: Triggered Effects (~300 skills)

```
┌─────────────────────────────────────────────────────────────┐
│ TRIGGERED EFFECTS - Conditional execution                   │
├─────────────────────────────────────────────────────────────┤
│ Trigger Condition         │ Example Skills                  │
├───────────────────────────┼─────────────────────────────────┤
│ "If target is casting"    │ Power Spike, Power Block        │
│ "If target is hexed"      │ Discord, Black Spider Strike    │
│ "If target has condition" │ Virulence, Malicious Strike     │
│ "If target is enchanted"  │ Drain Enchantment               │
│ "If target is attacking"  │ Signet of Clumsiness            │
│ "If target is moving"     │ Churning Earth                  │
│ "If you are enchanted"    │ Golden Fox Strike               │
│ "If health below X%"      │ Zealous Benediction             │
│ "When you take damage"    │ Dark Bond, Empathy              │
│ "When you attack"         │ Order of Pain                   │
│ "When you cast"           │ Backfire, Soul Leech            │
│ "When foe dies"           │ Malign Intervention             │
│ "When enchantment ends"   │ Blood Renewal, Illusion Weak.   │
│ "When knocked down"       │ Bed of Coals, Fetid Ground      │
└─────────────────────────────────────────────────────────────┘
```

### Category 5: Positional Effects (~200 skills)

```
┌─────────────────────────────────────────────────────────────┐
│ POSITIONAL EFFECTS - Area-based targeting                   │
├─────────────────────────────────────────────────────────────┤
│ Range Type    │ Approx Distance │ Examples                  │
├───────────────┼─────────────────┼───────────────────────────┤
│ Touch         │ Melee range     │ Blackout, Lift Enchant    │
│ Adjacent      │ ~50 units       │ Fragility, Dark Aura      │
│ Nearby        │ ~150 units      │ Suffering, Enfeebling Bl. │
│ In the area   │ ~200 units      │ Unholy Feast              │
│ Earshot       │ ~300 units      │ Shouts, "Stand Your Gr."  │
│ Half range    │ ~200 units      │ Shadow Prison, Scorpion W.│
│                                                             │
│ GROUND TARGET EFFECTS:                                      │
│ • Wells (exploit corpse, create zone)                       │
│ • Wards (ally protection zone)                              │
│ • Spirits (stationary ally with aura)                       │
│ • Traps (triggered when enemy approaches)                   │
│ • AoE damage zones (Bed of Coals, Ray of Judgment)          │
└─────────────────────────────────────────────────────────────┘
```

### Category 6: Summoning (~50 skills)

```
┌─────────────────────────────────────────────────────────────┐
│ SUMMONING - Create entities                                 │
├─────────────────────────────────────────────────────────────┤
│ Type          │ Behavior                                    │
├───────────────┼─────────────────────────────────────────────┤
│ Minions       │ Follow master, auto-attack, health decay    │
│ Spirits       │ Stationary, provide aura, limited health    │
│ Ranger Pet    │ Persistent companion, special attacks       │
│ Flesh Golem   │ Powerful minion, leaves corpse              │
│                                                             │
│ COMPLEXITY:                                                 │
│ • Minions need their own AI                                 │
│ • Death Magic minions decay over time                       │
│ • Spirits can be attacked and destroyed                     │
│ • Some effects scale with number of minions                 │
└─────────────────────────────────────────────────────────────┘
```

### Category 7: Special Mechanics (~100 skills)

```
┌─────────────────────────────────────────────────────────────┐
│ SPECIAL MECHANICS - Unique implementations required         │
├─────────────────────────────────────────────────────────────┤
│ Mechanic              │ Skills                              │
├───────────────────────┼─────────────────────────────────────┤
│ Shadow Step           │ ~30 skills - teleport to location   │
│ Skill replacement     │ Inspired Hex/Enchant, Sig of Capture│
│ Attack chains         │ Lead → Off-hand → Dual attacks      │
│ Corpse exploitation   │ Wells, minion raising               │
│ Mirroring             │ Mirrored Stance, Echo               │
│ Skill disabling       │ Blackout, Power Block (by attribute)│
│ Damage caps           │ Shadow Form (max 5-25 damage)       │
│ Invulnerability       │ Spell immunity, attack immunity     │
│ Return to location    │ Shadow Walk, Shadow Meld            │
│ Form transformation   │ Avatar skills, Shadow Form          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Challenges

### Challenge 1: Natural Language Parsing

Skills are defined in natural language, not code. Each description must be parsed and converted to executable logic.

**Example Complexity Levels:**

```
SIMPLE (Tier D):
"Deal 10...48 shadow damage to target foe."
→ dealDamage(target, scale(10, 48, attr), 'shadow')

MEDIUM (Tier B):
"For 8...20 seconds, target and adjacent foes take 5...20 damage
each time they suffer or recover from a new condition."
→ applyHex(target, {
    duration: scale(8, 20, attr),
    aoe: 'adjacent',
    trigger: {
      on: ['condition_applied', 'condition_removed'],
      effect: () => dealDamage(triggeredTarget, scale(5, 20, attr))
    }
  })

COMPLEX (Tier S):
"For 5...21 seconds, you cannot be the target of enemy spells,
and you gain 5 damage reduction for each Assassin enchantment on you.
You cannot deal more than 5...25 damage with a single skill or attack."
→ MULTIPLE SYSTEMS REQUIRED:
   1. Spell targeting immunity
   2. Dynamic armor calculation
   3. Enchantment counting by profession
   4. Outgoing damage cap
   5. Interaction with other damage modifiers
```

### Challenge 2: Effect Ordering

GW1 has specific rules for how effects resolve. Order matters.

```
EXAMPLE: Multiple damage modifiers

Base damage: 100
1. +20% from enchantment    → 120
2. -50 flat reduction       → 70
3. Armor calculation        → 56
4. 25% armor penetration    → ...

The order these apply changes the result significantly.
```

### Challenge 3: Interaction Matrix

Every skill can potentially interact with every other skill. With 1,484 skills, that's 2.2 million potential interactions.

```
┌─────────────────────────────────────────────────────────────┐
│ INTERACTION EXAMPLES                                        │
├─────────────────────────────────────────────────────────────┤
│ • Fragility + Fevered Dreams = condition spread + damage    │
│ • Spiteful Spirit + skill usage = damage per action         │
│ • Shadow Form + spells = immunity (but damage capped)       │
│ • Spell Breaker + hex = hex fails                           │
│ • Signet of Humility + elite = elite disabled for 25s       │
│ • Discord requires: hex AND condition = bonus damage        │
└─────────────────────────────────────────────────────────────┘
```

### Challenge 4: Deterministic Simulation

For async battles, the simulation MUST be 100% deterministic given the same inputs.

```
REQUIREMENTS:
• Seeded random number generator
• Fixed tick rate (no floating point errors)
• Consistent event ordering
• No race conditions
• Reproducible from replay log
```

---

## Phased Implementation Plan

### Phase 0: Foundation (Week 1-2)

```
┌─────────────────────────────────────────────────────────────┐
│ DELIVERABLES                                                │
├─────────────────────────────────────────────────────────────┤
│ □ Core tick-based simulation engine                         │
│ □ Unit state management                                     │
│ □ Event/action queue system                                 │
│ □ Deterministic RNG                                         │
│ □ Replay recording system                                   │
│ □ Basic 2D positioning                                      │
│ □ Health/energy/death handling                              │
│ □ Skill database loader (from existing JSON)                │
│ □ Attribute scaling calculator (already exists)             │
└─────────────────────────────────────────────────────────────┘
```

### Phase 1: Combat Foundation (Week 3-4)

```
┌─────────────────────────────────────────────────────────────┐
│ DELIVERABLES                                                │
├─────────────────────────────────────────────────────────────┤
│ □ Basic attack system (auto-attack)                         │
│ □ Skill casting (activation time, recharge)                 │
│ □ Movement system                                           │
│ □ Target selection                                          │
│ □ Range checking                                            │
│ □ Line of sight (simple)                                    │
│ □ Basic armor calculation                                   │
│ □ Damage types (physical, elemental, etc.)                  │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Effect System (Week 5-8)

```
┌─────────────────────────────────────────────────────────────┐
│ DELIVERABLES                                                │
├─────────────────────────────────────────────────────────────┤
│ □ Condition system (all 12 conditions)                      │
│ □ Enchantment system (apply, stack, remove)                 │
│ □ Hex system                                                │
│ □ Stance system (one at a time rule)                        │
│ □ Regeneration/degeneration (health, energy)                │
│ □ Effect triggers (on_hit, on_cast, on_death, etc.)         │
│ □ Effect duration tracking                                  │
│ □ Adrenaline system                                         │
│ □ Upkeep system (energy drain for maintained enchantments)  │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Skill Implementation - Tier D (Week 9-10)

```
┌─────────────────────────────────────────────────────────────┐
│ ~184 SIMPLE SKILLS                                          │
├─────────────────────────────────────────────────────────────┤
│ Implementation pattern:                                     │
│ 1. Parse skill description                                  │
│ 2. Map to effect primitives                                 │
│ 3. Generate skill handler                                   │
│ 4. Write unit test                                          │
│                                                             │
│ Target: 20 skills/day/instance × 20 instances = 400/day    │
│ Completion: ~1 day (with buffer for review)                │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Skill Implementation - Tier C (Week 11-13)

```
┌─────────────────────────────────────────────────────────────┐
│ ~400 LOW COMPLEXITY SKILLS                                  │
├─────────────────────────────────────────────────────────────┤
│ Target: 15 skills/day/instance × 20 instances = 300/day    │
│ Completion: ~2 days (with review/iteration)                │
│                                                             │
│ These include:                                              │
│ • Simple damage + condition                                 │
│ • Basic heals with minor conditions                         │
│ • Simple enchantments (stat buffs)                          │
│ • Basic hexes (single effect)                               │
└─────────────────────────────────────────────────────────────┘
```

### Phase 5: Skill Implementation - Tier B (Week 14-18)

```
┌─────────────────────────────────────────────────────────────┐
│ ~500 MEDIUM COMPLEXITY SKILLS                               │
├─────────────────────────────────────────────────────────────┤
│ Target: 8 skills/day/instance × 20 instances = 160/day     │
│ Completion: ~4 days (with extensive testing)               │
│                                                             │
│ These require:                                              │
│ • Conditional triggers                                      │
│ • AoE calculations                                          │
│ • Multiple effect chains                                    │
│ • Interaction with other systems                            │
└─────────────────────────────────────────────────────────────┘
```

### Phase 6: Skill Implementation - Tier A (Week 19-24)

```
┌─────────────────────────────────────────────────────────────┐
│ ~300 HIGH COMPLEXITY SKILLS                                 │
├─────────────────────────────────────────────────────────────┤
│ Target: 4 skills/day/instance × 20 instances = 80/day      │
│ Completion: ~4-5 days                                      │
│                                                             │
│ These require:                                              │
│ • Attack chains (assassin combos)                           │
│ • Interrupts with conditional effects                       │
│ • Complex attribute interactions                            │
│ • Multi-target prioritization                               │
└─────────────────────────────────────────────────────────────┘
```

### Phase 7: Skill Implementation - Tier S (Week 25-28)

```
┌─────────────────────────────────────────────────────────────┐
│ ~100 EXTREME COMPLEXITY SKILLS                              │
├─────────────────────────────────────────────────────────────┤
│ Target: 1-2 skills/day/instance × 20 instances = 20-40/day │
│ Completion: ~5-7 days                                      │
│                                                             │
│ These require:                                              │
│ • Custom logic for each skill                               │
│ • Extensive edge case handling                              │
│ • Careful interaction testing                               │
│                                                             │
│ Examples:                                                   │
│ • Shadow Form (spell immunity + damage cap)                 │
│ • Spiteful Spirit (AoE damage on every action)              │
│ • Fevered Dreams (condition spread)                         │
│ • Avatar of Balthazar (form transformation)                 │
└─────────────────────────────────────────────────────────────┘
```

### Phase 8: AI System (Week 29-31)

```
┌─────────────────────────────────────────────────────────────┐
│ SIMPLE RULE-BASED AI                                        │
├─────────────────────────────────────────────────────────────┤
│ Priority-based decision making:                             │
│                                                             │
│ 1. Self-preservation (heal if low, retreat if dying)        │
│ 2. Resurrect allies                                         │
│ 3. Remove dangerous conditions/hexes                        │
│ 4. Interrupt key skills                                     │
│ 5. Apply pressure (damage, hexes, conditions)               │
│ 6. Support allies (buffs, heals)                            │
│                                                             │
│ Build-specific behaviors:                                   │
│ • Monks prioritize healing                                  │
│ • Warriors engage in melee                                  │
│ • Mesmers interrupt and hex                                 │
│ • Elementalists AoE damage                                  │
└─────────────────────────────────────────────────────────────┘
```

### Phase 9: Integration & Testing (Week 32-35)

```
┌─────────────────────────────────────────────────────────────┐
│ INTEGRATION                                                 │
├─────────────────────────────────────────────────────────────┤
│ □ API endpoints for match creation                          │
│ □ Team composition validation                               │
│ □ Match resolution queue                                    │
│ □ Replay storage                                            │
│ □ Result calculation (winner, stats)                        │
│ □ Client replay player                                      │
│ □ 2D pixel art renderer (basic)                             │
│ □ Performance optimization                                  │
│ □ Stress testing                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Claude Army Strategy

### Organization Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLAUDE INSTANCE ALLOCATION                        │
│                             (20 Instances)                              │
└─────────────────────────────────────────────────────────────────────────┘

CORE TEAM (5 instances):
┌─────────────────────────────────────────────────────────────┐
│ [C1] - Engine Lead                                          │
│       Tick system, event queue, state management            │
│                                                             │
│ [C2] - Combat Systems                                       │
│       Damage calc, armor, targeting, movement               │
│                                                             │
│ [C3] - Effect Framework                                     │
│       Conditions, enchantments, hexes, triggers             │
│                                                             │
│ [C4] - Testing Lead                                         │
│       Test framework, integration tests, edge cases         │
│                                                             │
│ [C5] - API & Integration                                    │
│       Match API, replay system, client interface            │
└─────────────────────────────────────────────────────────────┘

SKILL SQUADS (15 instances, 3 squads of 5):
┌─────────────────────────────────────────────────────────────┐
│ SQUAD ALPHA (Warrior, Ranger, Assassin, Dervish)            │
│ [A1-A5] - Physical skills, attacks, stances                 │
│                                                             │
│ SQUAD BETA (Monk, Necromancer, Ritualist)                   │
│ [B1-B5] - Healing, death magic, spirits, hexes              │
│                                                             │
│ SQUAD GAMMA (Elementalist, Mesmer, Paragon)                 │
│ [G1-G5] - Spells, interrupts, shouts, chants                │
└─────────────────────────────────────────────────────────────┘
```

### Skill Implementation Protocol

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SKILL IMPLEMENTATION WORKFLOW                         │
└─────────────────────────────────────────────────────────────────────────┘

For each skill:

1. PARSE
   ├── Read skill description from skilldesc-en.json
   ├── Read mechanics from skilldata.json
   └── Identify effect categories

2. DESIGN
   ├── Map to existing effect primitives
   ├── Identify custom logic needed
   └── Document edge cases

3. IMPLEMENT
   ├── Create skill handler in /skills/{profession}/{skill-id}.ts
   ├── Use composition of effect primitives
   └── Handle scaling with attributes

4. TEST
   ├── Unit test: skill in isolation
   ├── Integration test: skill + other skills
   └── Edge case test: weird interactions

5. DOCUMENT
   ├── Add to skill registry
   ├── Note any deviations from GW1
   └── Flag for balance review if needed

FILE STRUCTURE:
/engine
  /core
    tick-system.ts
    event-queue.ts
    state-manager.ts
    rng.ts
  /combat
    damage-calculator.ts
    targeting.ts
    movement.ts
    armor.ts
  /effects
    conditions.ts
    enchantments.ts
    hexes.ts
    triggers.ts
  /skills
    /warrior
      001-healing-signet.ts
      ...
    /mesmer
      005-power-block.ts
      ...
    skill-registry.ts
  /ai
    decision-engine.ts
    build-behaviors.ts
  /replay
    recorder.ts
    player.ts
```

### Communication Protocol

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INTER-INSTANCE COMMUNICATION                          │
└─────────────────────────────────────────────────────────────────────────┘

Shared resources (via git):
• /docs/SKILL_ASSIGNMENTS.md      - Who's working on what
• /docs/EFFECT_PRIMITIVES.md      - Available building blocks
• /docs/EDGE_CASES.md             - Known interactions
• /docs/BLOCKERS.md               - Cross-team dependencies

Branch strategy:
• main                            - Stable engine
• develop                         - Integration
• skill/{profession}/{range}      - Skill implementations
• engine/{component}              - Core systems

Merge protocol:
1. Core team merges engine changes to develop daily
2. Skill squads rebase on develop before PR
3. Test lead runs full suite before main merge
```

---

## Technical Architecture

### Server Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SERVER ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Match Queue   │────▶│   Simulation    │
│   (Frontend)    │     │   (Redis/Bull)  │     │   Workers       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               ▼
        │                                       ┌─────────────────┐
        │                                       │   Engine Core   │
        │                                       │   (Pure TS)     │
        │                                       └─────────────────┘
        │                                               │
        ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│   Supabase DB   │◀────────────────────────────│   Replay Store  │
│   (PostgreSQL)  │                             │   (JSON/Binary) │
└─────────────────┘                             └─────────────────┘

Data Flow:
1. Client submits team compositions
2. Queue stores match request
3. Worker picks up match
4. Engine simulates battle (deterministic)
5. Replay stored to database
6. Client notified, fetches replay
7. Client renders replay locally
```

### Replay Format

```typescript
interface BattleReplay {
  matchId: string
  version: string
  seed: number                    // For deterministic replay

  teams: {
    a: TeamComposition
    b: TeamComposition
  }

  initialState: BattleState       // Starting positions, stats

  events: BattleEvent[]           // All events in order

  result: {
    winner: 'a' | 'b' | 'draw'
    duration: number              // Ticks
    finalState: BattleState
  }
}

interface BattleEvent {
  tick: number
  type: EventType
  source: UnitId
  target?: UnitId | UnitId[]
  skillId?: SkillId
  data: EventData                 // Type-specific data
}

// Example events:
// { tick: 100, type: 'CAST_START', source: 'a1', skillId: 28, target: 'b3' }
// { tick: 125, type: 'DAMAGE', source: 'a1', target: 'b3', data: { amount: 87, type: 'shadow' } }
// { tick: 125, type: 'HEX_APPLIED', source: 'a1', target: 'b3', data: { hexId: 28, duration: 100 } }
```

### Client Replay Renderer

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CLIENT REPLAY SYSTEM                              │
└─────────────────────────────────────────────────────────────────────────┘

Technologies:
• Canvas 2D or PixiJS for rendering
• RequestAnimationFrame for smooth playback
• State interpolation for smooth movement

Render Loop:
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Load replay JSON                                                     │
│ 2. Initialize state from replay.initialState                           │
│ 3. For each frame (60fps):                                             │
│    a. Advance tick counter                                             │
│    b. Apply events up to current tick                                  │
│    c. Interpolate positions                                            │
│    d. Render units at interpolated positions                           │
│    e. Render effects (damage numbers, spell effects)                   │
│    f. Render UI (health bars, skill bars)                              │
│ 4. Playback controls: pause, speed, scrub                              │
└────────────────────────────────────────────────────────────────────────┘

Pixel Art Assets Needed:
• 10 profession sprites (idle, walk, attack, cast, death)
• 8 direction variants each
• Skill effect sprites (~50 unique effects)
• UI elements (health bar, energy bar, condition icons)
```

---

## Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Skill interactions cause infinite loops | Critical | Max effect depth, circuit breakers |
| Performance: 12 units × 1484 skills | Critical | Optimize hot paths, profile early |
| Edge cases in GW1 not documented | High | Community feedback, wiki research |
| Determinism failures | High | Extensive RNG testing, no floats |
| Balance issues (unlike real GW1) | Medium | Accept differences, note deviations |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Art assets delayed | Medium | Use placeholder sprites |
| Skill descriptions ambiguous | Medium | Make judgment call, document |
| AI too predictable | Medium | Add randomness, multiple strategies |
| Replay files too large | Low | Binary format, compression |

### Scope Creep Risks

```
EXPLICITLY OUT OF SCOPE (Phase 1):
• Weapons and weapon types
• Armor and insignias
• Runes (attribute bonuses)
• Title track skills (PvE only)
• Environmental effects
• Heroes with special mechanics
• PvP-specific skill versions
• Consumables
```

---

## Difficulty Assessment

### Overall Difficulty: 8.5/10

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DIFFICULTY BREAKDOWN                               │
├─────────────────────────────────────────────────────────────────────────┤
│ Component                              Difficulty   Effort              │
├─────────────────────────────────────────────────────────────────────────┤
│ Core engine (tick, events, state)      ████████░░   30 days            │
│ Combat fundamentals                    ██████░░░░   20 days            │
│ Effect system (conditions, buffs)      ████████░░   30 days            │
│ 1,484 skill implementations            █████████░   120+ days          │
│ AI system                              ███████░░░   25 days            │
│ Replay system                          █████░░░░░   15 days            │
│ Client renderer                        ██████░░░░   20 days            │
│ Integration & testing                  ████████░░   30 days            │
├─────────────────────────────────────────────────────────────────────────┤
│ TOTAL ESTIMATED EFFORT                             ~290 person-days    │
│ WITH 20 CLAUDE INSTANCES (parallel)                ~15-20 workdays     │
│ REALISTIC CALENDAR TIME                            2-3 months          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why It's Hard

1. **Natural Language → Code Translation**: 1,484 unique descriptions
2. **Combinatorial Complexity**: Skill interactions are exponential
3. **Domain Knowledge Required**: GW1 mechanics are deep and nuanced
4. **Determinism Requirements**: Async play demands perfect reproducibility
5. **Balance Expectations**: Players will compare to real GW1

### Why It's Achievable

1. **Existing Skill Data**: Full database already parsed and available
2. **Composable Effects**: Most skills combine primitive effects
3. **Parallel Implementation**: Skill squads can work independently
4. **Iterative Approach**: Can launch with subset, add skills over time
5. **Community Feedback**: GW1 players will help find bugs

---

## Recommended Approach

### MVP Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MVP SCOPE (v0.1)                                │
├─────────────────────────────────────────────────────────────────────────┤
│ • 6v6 battles with 3 professions (Warrior, Monk, Elementalist)          │
│ • ~100 skills (most common/impactful)                                   │
│ • Core combat loop complete                                             │
│ • Basic AI                                                              │
│ • Simple 2D renderer (rectangles, not sprites)                          │
│ • Async match resolution                                                │
│                                                                          │
│ ESTIMATED EFFORT: 40-60 person-days                                     │
│ WITH 20 INSTANCES: ~3-4 workdays                                        │
│ CALENDAR TIME: 1-2 weeks                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Full Release Strategy

Launch MVP, gather feedback, expand incrementally:

1. **v0.1** - 3 professions, 100 skills, basic combat
2. **v0.2** - Add Necromancer, Mesmer (+200 skills)
3. **v0.3** - Add Ranger, Assassin (+200 skills)
4. **v0.4** - Add Ritualist, Paragon, Dervish (+400 skills)
5. **v0.5** - Complete all remaining skills
6. **v1.0** - Polish, balance, pixel art

---

## Questions Before Finalizing

Before we proceed, I have some clarifying questions:

1. **Fidelity Level**: How accurate to GW1 do you want?
   - Exact replication (very hard)
   - Spiritually similar (hard)
   - Inspired by (medium)

2. **PvE vs PvP Skills**: GW1 has ~200 skills with PvE/PvP variants. Include both?

3. **Minions/Spirits**: These add significant complexity. Include in MVP?

4. **Art Style**:
   - Placeholder sprites first, art later?
   - Commission pixel art early?
   - Use existing GW1 assets (legal concerns)?

5. **AI Sophistication**:
   - Simple priority-based (faster to implement)
   - Build-aware (knows skill synergies)
   - Learning AI (complex, long-term)

6. **Match Duration**:
   - Timed (first to win condition)
   - Last standing (death match)
   - Round-based (like real GvG)?

7. **Team Composition Rules**:
   - Any 6 builds?
   - One profession per team?
   - Meta restrictions?

---

## Conclusion

Building a GW1 teamfight simulator is ambitious but achievable. The skill data is already available, the mechanics are documented, and with 20 Claude instances working in parallel, the implementation timeline becomes manageable.

The key insight is that most skills are **compositions of effect primitives**. Build a robust effect system, and implementing 80% of skills becomes mechanical. The remaining 20% (Tier A and S skills) require careful individual attention.

**My recommendation**: Start with an MVP of 3 professions and ~100 skills to validate the architecture. Expand iteratively based on community feedback.

Let me know your answers to the questions above, and I'll refine this plan into an actionable implementation guide.
