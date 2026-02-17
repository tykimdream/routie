export interface TspResult {
  order: number[];
  totalCost: number;
}

/**
 * Nearest Neighbor heuristic + 2-opt local search
 * Suitable for <=10 places (<10ms)
 */
export function solveTsp(distMatrix: number[][], startIndex = 0): TspResult {
  const n = distMatrix.length;
  if (n <= 1) return { order: [0], totalCost: 0 };
  if (n === 2) {
    return {
      order: [0, 1],
      totalCost: distMatrix[0]![1] ?? 0,
    };
  }

  // Step 1: Nearest Neighbor from all starting nodes
  let bestOrder = nearestNeighbor(distMatrix, startIndex);
  let bestCost = routeCost(bestOrder, distMatrix);

  for (let s = 0; s < n; s++) {
    const order = nearestNeighbor(distMatrix, s);
    const cost = routeCost(order, distMatrix);
    if (cost < bestCost) {
      bestOrder = order;
      bestCost = cost;
    }
  }

  // Step 2: 2-opt improvement
  const improved = twoOpt(bestOrder, distMatrix);
  const improvedCost = routeCost(improved, distMatrix);

  if (improvedCost < bestCost) {
    return { order: improved, totalCost: improvedCost };
  }

  return { order: bestOrder, totalCost: bestCost };
}

function nearestNeighbor(dist: number[][], start: number): number[] {
  const n = dist.length;
  const visited = new Set<number>([start]);
  const order = [start];

  while (visited.size < n) {
    const current = order[order.length - 1]!;
    let nearest = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < n; i++) {
      const d = dist[current]![i] ?? Infinity;
      if (!visited.has(i) && d < nearestDist) {
        nearest = i;
        nearestDist = d;
      }
    }

    if (nearest === -1) break;
    visited.add(nearest);
    order.push(nearest);
  }

  return order;
}

function twoOpt(route: number[], dist: number[][]): number[] {
  const n = route.length;
  let improved = true;
  let best = [...route];

  while (improved) {
    improved = false;
    for (let i = 1; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const delta = twoOptDelta(best, dist, i, j);
        if (delta < -0.001) {
          const reversed = [...best];
          let l = i;
          let r = j;
          while (l < r) {
            [reversed[l], reversed[r]] = [reversed[r]!, reversed[l]!];
            l++;
            r--;
          }
          best = reversed;
          improved = true;
        }
      }
    }
  }

  return best;
}

function twoOptDelta(
  route: number[],
  dist: number[][],
  i: number,
  j: number,
): number {
  const a = route[i - 1]!;
  const b = route[i]!;
  const c = route[j]!;
  const d = route[j + 1] ?? route[0]!;

  return (
    (dist[a]![c] ?? 0) +
    (dist[b]![d] ?? 0) -
    (dist[a]![b] ?? 0) -
    (dist[c]![d] ?? 0)
  );
}

function routeCost(order: number[], dist: number[][]): number {
  let cost = 0;
  for (let i = 0; i < order.length - 1; i++) {
    cost += dist[order[i]!]![order[i + 1]!] ?? 0;
  }
  return cost;
}
