# 梵音房（BON-ON-BO）

声明・梵鐘・木魚などの響きを制作する仏教音楽Webアプリ。仕様は [SPECIFICATION.md](SPECIFICATION.md) を参照すること。

## コマンド

- `npm run dev` — 開発サーバー
- `npm run typecheck` — 型チェック
- `npm run lint` — oxlint
- `npm test` — Vitest
- `npm run build` — 本番ビルド

## アーキテクチャ

- `src/audio/` と `src/model/` はReact / Zustandに依存しない純粋TypeScript
- 依存方向はUI → store → model / audio
- 音響はWeb Audio APIを直接使用する
- リアルタイム再生とWAV書き出しは同じ音響エンジンを使用する
- 8bit化やビットクラッシュ処理は追加しない

## デザイン

- 夜の伽藍、光背、曼荼羅をモチーフにする
- 濃紺・漆黒・金泥を基本色とする
- ドット絵、ピクセルフォント、ゲーム機風UIは使用しない
