import * as fs from "node:fs";
import * as readline from 'node:readline';

type Point = {
  x: number;
  y: number;
};

type PriceRatio = {
  price: number;
  ratio: number;
}

const priceStep = 50;
const maxPrice = 800;

function main() {
  console.log(process.argv)
  readFile(process.argv[3] || "PSMrawdata.csv");
}

function isParallel(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const dx1 = p2.x - p1.x;
  const dy1 = p2.y - p1.y;
  const dx2 = p4.x - p3.x;
  const dy2 = p4.y - p3.y;

  const crossProduct = dx1 * dy2 - dy1 * dx2;
  return Math.abs(crossProduct) < 1e-10;
}

function calcIntersectionCoord(p1: Point, p2: Point, p3: Point, p4: Point): Point {
  if (isParallel(p1, p2, p3, p4)) {
    throw new Error("The lines are parallel and do not intersect.");
  }
  const x = ((p3.y - p1.y) * (p1.x - p2.x) * (p3.x - p4.x) + p1.x * (p1.y - p2.y) * (p3.x - p4.x) - p3.x * (p3.y - p4.y) * (p1.x - p2.x))
    / ((p1.y - p2.y) * (p3.x - p4.x) - (p1.x - p2.x) * (p3.y - p4.y));
  const y = x * (p1.y - p2.y) / (p1.x - p2.x) + p1.y
    - p1.x * (p1.y - p2.y) / (p1.x - p2.x);
  return { x, y };
}

//交差する場所を探る
function findIntersection(cheap: PriceRatio[], expensive: PriceRatio[]): Point | null {
  for (let i = 1; i < cheap.length; i++) {
    if (cheap[i - 1]!.ratio > expensive[i - 1]!.ratio && cheap[i]!.ratio <= expensive[i]!.ratio) {
      const p1: Point = { x: cheap[i - 1]!.price, y: cheap[i - 1]!.ratio };
      const p2: Point = { x: cheap[i]!.price, y: cheap[i]!.ratio };
      const p3: Point = { x: expensive[i - 1]!.price, y: expensive[i - 1]!.ratio };
      const p4: Point = { x: expensive[i]!.price, y: expensive[i]!.ratio };
      const intersection = calcIntersectionCoord(p1, p2, p3, p4);
      return { x: intersection.x, y: intersection.y };
    }
  }
  return null;
}


function readFile(filename: string) {
  const expensives: number[] = [];
  const tooExpensives: number[] = [];
  const cheaps: number[] = [];
  const tooCheaps: number[] = [];
  let isFirstLine = true;
  const readStream = fs.createReadStream(filename);
  const rl = readline.createInterface({
    input: readStream
  });

  rl.on('line', (line) => {
    if (isFirstLine) {
      isFirstLine = false;
    }
    if (!isFirstLine) {
      const row = line.split(",")
      expensives.push(parseInt(row[1]!))
      cheaps.push(parseInt(row[2]!))
      tooExpensives.push(parseInt(row[3]!))
      tooCheaps.push(parseInt(row[4]!))
    }
  });

  rl.on('close', () => {
    const total = expensives.length;
    const { expensiveRatios, tooExpensiveRatios, cheapRatios, tooCheapRatios } = calculateRatios(expensives, tooExpensives, cheaps, tooCheaps, total);
    logResults(expensiveRatios, tooExpensiveRatios, cheapRatios, tooCheapRatios);
  })
}

function calculateRatios(expensives: number[], tooExpensives: number[], cheaps: number[], tooCheaps: number[], total: number) {
  const expensiveRatios: PriceRatio[] = [];
  const tooExpensiveRatios: PriceRatio[] = [];
  const cheapRatios: PriceRatio[] = [];
  const tooCheapRatios: PriceRatio[] = [];

  for (let i = 0; i <= maxPrice; i += priceStep) {
    const expensiveCount = expensives.filter((price) => price <= i);
    const tooExpensiveCount = tooExpensives.filter((price) => price <= i);
    const cheapCount = cheaps.filter((price) => price >= i);
    const tooCheapCount = tooCheaps.filter((price) => price >= i);

    expensiveRatios.push({ price: i, ratio: expensiveCount.length / total * 100 });
    tooExpensiveRatios.push({ price: i, ratio: tooExpensiveCount.length / total * 100 });
    cheapRatios.push({ price: i, ratio: cheapCount.length / total * 100 });
    tooCheapRatios.push({ price: i, ratio: tooCheapCount.length / total * 100 });
  }

  return { expensiveRatios, tooExpensiveRatios, cheapRatios, tooCheapRatios };
}

function logResults(expensiveRatios: PriceRatio[], tooExpensiveRatios: PriceRatio[], cheapRatios: PriceRatio[], tooCheapRatios: PriceRatio[]) {
  const marginalExpensive = findIntersection(cheapRatios, tooExpensiveRatios)?.x;   // 最高価格
  const indifferencePrice = findIntersection(cheapRatios, expensiveRatios)?.x;     // 妥協価格
  const optimalPrice = findIntersection(tooCheapRatios, tooExpensiveRatios)?.x; // 理想価格
  const marginalCheap = findIntersection(tooCheapRatios, expensiveRatios)?.x;       // 最低品質保証価格

  console.log(`最高価格：${marginalExpensive ? Math.round(marginalExpensive) : '計算不可'}円`);
  console.log(`妥協価格：${indifferencePrice ? Math.round(indifferencePrice) : '計算不可'}円`);
  console.log(`理想価格：${optimalPrice ? Math.round(optimalPrice) : '計算不可'}円`);
  console.log(`最低品質保証価格：${marginalCheap ? Math.round(marginalCheap) : '計算不可'}円`);
}

main();
