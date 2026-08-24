# AISC Section Finder

AISC Shapes Database v16.0 (2,299개 단면) 검색 + KS 규격식 호칭 병기 + 조립단면(BH) 구성기.
`PLAN_1.md`(저장소 상위 폴더)의 설계를 따릅니다.

## 개발

```bash
npm install
npm run dev
```

## 데이터 재생성

`source/aisc-shapes-database-v160-2.xlsx`가 바뀌면:

```bash
python tools/build_data.py
```

`src/data/*.json`을 재생성합니다 (13개 타입별 파일 + index.json + defs.json).

## 빌드 / 배포

```bash
npm run build
```

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 GitHub Pages로 자동 배포합니다.

## 사이드바 그룹 (9개)

I-SHAPES · TEES · HOLLOW · ANGLES · CHANNELS · BUILT-UP(BH) · PURLIN · METAL DECK · REBAR

- Purlin-CEE/ZEE: 원본 PDF(link 5)가 이미지 위주라 치수표 미확정 (`src/data/purlin.json` 참고)
- Metal Deck: 프로파일명만 확정, 게이지별 하중표는 미정 (`src/data/metaldeck.json` 참고)
- Rebar: #3~#18 전체 확정 데이터
