# ALE Agent Implementation Plan for AnkrCode

> **Date**: 18 January 2026
> **Status**: Phase 1 Complete - Core Engine Implemented
> **Inspired by**: Sakana AI's ALE-Agent (Winner of AtCoder Heuristic Contest AHC058)

---

## Executive Summary

This document outlines the implementation plan for integrating ALE (Agentic Learning Engine) capabilities into AnkrCode v2.42.0. The ALE engine enables inference-time optimization through multi-trial iteration, Virtual Power scoring, and working memory for failed strategy avoidance.

---

## Phase 1: Core Engine (COMPLETED)

### Files Created

| File | Purpose | Status |
|------|---------|--------|
| `src/ale/types.ts` | Type definitions for all ALE components | Done |
| `src/ale/ale-engine.ts` | Main optimization loop with multi-trial support | Done |
| `src/ale/virtual-power.ts` | Forward-looking value scorer | Done |
| `src/ale/insights.ts` | Trial reflection and pattern extraction | Done |
| `src/ale/solution-space.ts` | Greedy + Annealing exploration strategies | Done |
| `src/ale/working-memory.ts` | EON integration for failed strategy avoidance | Done |
| `src/ale/index.ts` | Module exports | Done |

### Key Features Implemented

1. **Multi-Trial Optimization Loop**
   - Configurable max trials and duration
   - Temperature-based exploration
   - Convergence detection
   - Progress tracking with callbacks

2. **Virtual Power Scoring**
   - Building blocks factor (reusable components)
   - Extensibility factor
   - Learning trajectory analysis
   - Compound potential estimation
   - Risk mitigation scoring

3. **Insights Generator**
   - Success/failure detection
   - Pattern recognition (plateau, oscillation, breakthrough)
   - Strategy effectiveness analysis
   - Component-level insights

4. **Solution Space Explorer**
   - Greedy exploration
   - Simulated Annealing with temperature cooling
   - Hybrid strategy (Greedy baseline + Annealing refinement)
   - Beam search
   - Evolutionary (genetic algorithm style)
   - Reconstruction (delete and rebuild sections)

5. **Working Memory (EON Integration)**
   - Failed strategy storage and recall
   - Success pattern learning
   - Insight persistence
   - Context injection for prompts

---

## Phase 2: Agent Integration (TODO)

### 2.1 Connect ALE to Existing Agents

```typescript
// TODO: Modify src/agents/manager.ts
- Add 'optimizer' agent type
- Integrate ALE engine into agent iteration loop
- Store agent trials as ALE trials
```

### 2.2 Add ALE-Enhanced Agent Type

```typescript
// New agent configuration
optimizer: {
  name: 'Optimizer',
  description: 'Multi-trial optimization with learning',
  tools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
  systemPrompt: `You are an optimization specialist using ALE...`,
  maxIterations: 100,
  timeout: 600,
  aleConfig: {
    strategy: 'hybrid',
    virtualPowerWeight: 0.3,
    useWorkingMemory: true,
  },
}
```

### 2.3 Tasks

- [ ] Create `src/agents/optimizer.ts` - ALE-enhanced agent
- [ ] Update `src/agents/types.ts` - Add optimizer type
- [ ] Update `src/agents/manager.ts` - Register optimizer agent
- [ ] Add CLI command `ankrcode agent optimize <task>`

---

## Phase 3: Tasher Integration (TODO)

### 3.1 Connect ALE to Tasher Orchestrator

The Tasher orchestrator (Manus-style) should use ALE for task optimization.

```
TaskDecomposer
    ↓
ALE Engine (optimize decomposition)
    ↓
StepExecutor (with ALE-guided strategy)
    ↓
MemoryAgent (store to EON via Working Memory)
```

### 3.2 Tasks

- [ ] Update `/root/ankr-labs-nx/packages/tasher/src/orchestrator.ts`
- [ ] Add ALE pre-optimization step before task execution
- [ ] Use Working Memory for cross-task learning
- [ ] Connect Tasher's MemoryAgent to ALE Working Memory

---

## Phase 4: LLM Integration (TODO)

### 4.1 Custom Scorer with LLM

Replace placeholder scorer with actual LLM evaluation:

```typescript
aleEngine.setScorer(async (solution, context) => {
  const prompt = buildScoringPrompt(solution, context);
  const response = await llmClient.chat(prompt);
  return parseScoringResponse(response);
});
```

### 4.2 Custom Generator with LLM

Replace placeholder generator with actual LLM generation:

```typescript
aleEngine.setGenerator(async (context) => {
  const prompt = buildGenerationPrompt(context);
  const response = await llmClient.chat(prompt);
  return parseGeneratedSolution(response);
});
```

### 4.3 Tasks

- [ ] Create `src/ale/llm-scorer.ts` - LLM-based scoring
- [ ] Create `src/ale/llm-generator.ts` - LLM-based generation
- [ ] Add prompt templates for scoring and generation
- [ ] Integrate with AI Proxy (port 4444)
- [ ] Add cost tracking for ALE operations

---

## Phase 5: CLI Commands (TODO)

### 5.1 New Commands

```bash
# Run ALE optimization
ankrcode ale optimize "Optimize the caching strategy" --trials 50 --strategy hybrid

# View optimization history
ankrcode ale history

# View insights
ankrcode ale insights

# Clear working memory
ankrcode ale clear-memory

# Export optimization results
ankrcode ale export <session-id> --format json
```

### 5.2 Tasks

- [ ] Create `src/commands/ale.ts` - ALE CLI commands
- [ ] Add to command registry
- [ ] Add shell completions for ALE commands

---

## Phase 6: Workflow Integration (TODO)

### 6.1 ALE Step in Workflows

```yaml
name: optimize-api
steps:
  - name: analyze
    type: agent
    agent: researcher
    task: "Analyze current API performance"

  - name: optimize
    type: ale
    task: "Optimize API response time"
    objective: "Sub-100ms p95 latency"
    constraints:
      - "Maintain backwards compatibility"
      - "No new dependencies"
    strategy: hybrid
    maxTrials: 30

  - name: implement
    type: agent
    agent: coder
    task: "Implement optimization from {{ steps.optimize.solution }}"
```

### 6.2 Tasks

- [ ] Update `src/workflow/engine.ts` - Add ALE step type
- [ ] Create `src/workflow/ale-step.ts` - ALE step executor
- [ ] Add workflow templates with ALE steps

---

## Phase 7: Metrics & Monitoring (TODO)

### 7.1 ALE Metrics

Track and expose metrics for ALE operations:

- Total optimizations run
- Average trials per optimization
- Success rate (target score achieved)
- Average score improvement
- Working memory hit rate
- Cost per optimization

### 7.2 Tasks

- [ ] Create `src/ale/metrics.ts` - Metrics collection
- [ ] Integrate with Pulse monitoring
- [ ] Add dashboard for ALE performance
- [ ] Add cost tracking per optimization

---

## Usage Examples

### Basic Optimization

```typescript
import { optimize } from '@ankrcode/core/ale';

const result = await optimize({
  task: 'Optimize database query performance',
  objective: 'Reduce query time from 500ms to under 50ms',
  constraints: [
    'Cannot modify table schema',
    'Must support existing API contract',
  ],
  maxTrials: 50,
  strategy: 'hybrid',
  virtualPowerWeight: 0.3,
});

console.log('Best solution:', result.bestSolution.content);
console.log('Score:', result.bestScore.totalScore);
console.log('Trials:', result.totalTrials);
console.log('Insights:', result.insights.length);
```

### Quick Optimization

```typescript
import { quickOptimize } from '@ankrcode/core/ale';

const { solution, score, insights } = await quickOptimize(
  'Refactor authentication flow',
  'Improve security while maintaining UX',
  { strategy: 'balanced' }
);
```

### Custom Scorer

```typescript
import { aleEngine } from '@ankrcode/core/ale';

aleEngine.setScorer(async (solution, context) => {
  // Run tests
  const testResult = await runTests(solution.code);

  // Analyze coverage
  const coverage = await analyzeCoverage(solution.code);

  return {
    solutionId: solution.id,
    immediateScore: testResult.passed ? 0.8 : 0.2,
    virtualPowerScore: coverage / 100,
    totalScore: (testResult.passed ? 0.8 : 0.2) * 0.7 + (coverage / 100) * 0.3,
    components: {
      correctness: testResult.passed ? 1 : 0,
      efficiency: testResult.duration < 1000 ? 0.8 : 0.4,
      maintainability: coverage / 100,
      potential: 0.5,
    },
    confidence: 0.9,
    reasoning: `Tests ${testResult.passed ? 'passed' : 'failed'}, coverage ${coverage}%`,
  };
});
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                             │
│              "Optimize the caching strategy"                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ALE ENGINE                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   OPTIMIZATION LOOP                      │   │
│  │  for trial in 1..maxTrials:                             │   │
│  │    1. Generate candidate solution                        │   │
│  │    2. Score with Virtual Power                           │   │
│  │    3. Accept/reject (annealing)                          │   │
│  │    4. Generate insights                                  │   │
│  │    5. Update working memory                              │   │
│  │    6. Check convergence                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │Virtual Power │  │   Insights   │  │  Solution    │          │
│  │   Scorer     │  │  Generator   │  │   Space      │          │
│  │              │  │              │  │  Explorer    │          │
│  │ - Building   │  │ - Success/   │  │ - Greedy     │          │
│  │   blocks     │  │   failure    │  │ - Annealing  │          │
│  │ - Extend-    │  │ - Patterns   │  │ - Hybrid     │          │
│  │   ability    │  │ - Component  │  │ - Beam       │          │
│  │ - Learning   │  │   analysis   │  │ - Evolution  │          │
│  │   trajectory │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   WORKING MEMORY                         │   │
│  │  - Failed strategies (avoid repeating)                   │   │
│  │  - Success patterns (leverage again)                     │   │
│  │  - Insights (accumulated learning)                       │   │
│  │  - EON integration (persistent storage)                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       OPTIMIZED RESULT                           │
│  - Best solution found                                           │
│  - Score breakdown                                               │
│  - Insights learned                                              │
│  - Trial history                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Comparison: Before vs After ALE

| Aspect | Before (Single-pass) | After (ALE) |
|--------|---------------------|-------------|
| Iterations | 1 | 10-100+ |
| Strategy | Fixed | Adaptive (greedy → annealing) |
| Scoring | Immediate only | Immediate + Virtual Power |
| Learning | None | Insights + Working Memory |
| Failed strategy | May repeat | Avoided via memory |
| Convergence | Not detected | Auto-detected |
| Cost tracking | N/A | Per-trial metrics |

---

## Timeline

| Phase | Description | Est. Effort |
|-------|-------------|-------------|
| Phase 1 | Core Engine | DONE |
| Phase 2 | Agent Integration | 2-3 days |
| Phase 3 | Tasher Integration | 2-3 days |
| Phase 4 | LLM Integration | 3-4 days |
| Phase 5 | CLI Commands | 1-2 days |
| Phase 6 | Workflow Integration | 2-3 days |
| Phase 7 | Metrics & Monitoring | 2-3 days |

**Total remaining**: ~15-20 days

---

## References

- [Sakana AI Blog: ALE-Agent](https://sakana.ai/ale-agent/)
- [VentureBeat Article: Sakana AI's big win](https://venturebeat.com/ai/sakana-ai-ale-agent/)
- [AtCoder Heuristic Contest AHC058](https://atcoder.jp/contests/ahc058)

---

*Last Updated: 18 January 2026*
