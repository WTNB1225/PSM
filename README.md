# 使い方

## ローカル実行

```bash
yarn install
yarn start
```

## Docker 実行

```bash
docker compose up --build -d
docker compose exec psm yarn start
```

## 入力CSVを指定して実行

```bash
yarn start --csvfile PSMrawdata.csv
docker compose exec psm yarn start --csvfile PSMrawdata.csv
```