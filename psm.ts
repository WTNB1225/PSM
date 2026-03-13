import * as fs from "node:fs";
import * as readline from 'node:readline';

type Point = {
    x: number;
    y: number;
};

type PriceAndRatio = {
    price: number;
    ratio: number;
}

// Todo: 直線が平行な場合の処理や、交点が存在しない場合の処理
function calc_intersection_coord(p1: Point, p2: Point, p3: Point, p4: Point): Point {
    const x = ((p3.y - p1.y) * (p1.x - p2.x) * (p3.x - p4.x) + p1.x * (p1.y - p2.y) * (p3.x - p4.x) - p3.x * (p3.y - p4.y) * (p1.x - p2.x))
        / ((p1.y - p2.y) * (p3.x - p4.x) - (p1.x - p2.x) * (p3.y - p4.y));

    const y = x * (p1.y - p2.y) / (p1.x - p2.x) + p1.y
        - p1.x * (p1.y - p2.y) / (p1.x - p2.x);
    return { x, y };
}
/*
    tooExpensive cheap 最高価格
    expensive cheap 妥協価格
    tooExpensive tooCheap 理想価格
    expensive tooCheap 最低品質保証価格
 */

//交差する場所を探る
function find_intersection(cheap: PriceAndRatio[], expensive: PriceAndRatio[]) {
    for (let i = 1; i < cheap.length; i++) {
        if (cheap[i - 1]!.ratio > expensive[i - 1]!.ratio && cheap[i]!.ratio <= expensive[i]!.ratio) {
            const p1: Point = { x: cheap[i - 1]!.price, y: cheap[i - 1]!.ratio };
            const p2: Point = { x: cheap[i]!.price, y: cheap[i]!.ratio };
            const p3: Point = { x: expensive[i - 1]!.price, y: expensive[i - 1]!.ratio };
            const p4: Point = { x: expensive[i]!.price, y: expensive[i]!.ratio };
            const intersection = calc_intersection_coord(p1, p2, p3, p4);          
            return intersection;
        }
    }
}
const expensive: number[] = [];
const tooExpensive: number[] = [];
const cheap: number[] = [];
const tooCheap: number[] = [];
let line_num = 0;

const readStream = fs.createReadStream(process.argv[3] || "PSMrawdata.csv");
const rl = readline.createInterface({
    input: readStream
});
rl.on('line', (line) => {
    if (line_num != 0) {
    const row = line.split(",")
    expensive.push(parseInt(row[1]!))
    cheap.push(parseInt(row[2]!))
    tooExpensive.push(parseInt(row[3]!))
    tooCheap.push(parseInt(row[4]!))
    } 
    line_num++;
});

rl.on('close', () => {
    const expensiveRatio: PriceAndRatio[] = [];
    const tooExpensiveRatio: PriceAndRatio[] = [];
    const cheapRatio: PriceAndRatio[] = [];
    const tooCheapRatio: PriceAndRatio[] = [];
    const prices = [...expensive, ...cheap, ...tooCheap, ...tooExpensive]
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    for (let i = min; i <= max; i += 50) {
        const total = expensive.length;
        const result1 = expensive.filter((price) => price <= i);
        const result2 = tooExpensive.filter((price) => price <= i);
        const result3 = cheap.filter((price) => price >= i);
        const result4 = tooCheap.filter((price) => price >= i);

        expensiveRatio.push({ price: i, ratio: result1.length / total * 100});
        tooExpensiveRatio.push({ price: i, ratio: result2.length / total * 100});
        cheapRatio.push({ price: i, ratio: result3.length / total * 100});
        tooCheapRatio.push({ price: i, ratio: result4.length / total * 100});
    }
   
    const optimalPrice = find_intersection(tooCheapRatio, tooExpensiveRatio); // 理想価格
    const indifferencePrice = find_intersection(cheapRatio, expensiveRatio);     // 妥協価格
    const marginalExpensive = find_intersection(cheapRatio, tooExpensiveRatio);   // 最高価格
    const marginalCheap = find_intersection(tooCheapRatio, expensiveRatio);       // 最低品質保証価格


    console.log(`最高価格：${marginalExpensive?.x.toFixed(0) ?? '計算不可'}円`);
    console.log(`妥協価格：${indifferencePrice?.x.toFixed(0) ?? '計算不可'}円`);
    console.log(`理想価格：${optimalPrice?.x.toFixed(0) ?? '計算不可'}円`);
    console.log(`最低品質保証価格：${marginalCheap?.x.toFixed(0) ?? '計算不可'}円`);
})


