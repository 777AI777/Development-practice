# OKINY 画面遷移図（As-Is / To-Be）

`UI_mock.pen` を正として、現行実装の遷移とSNS拡張後の遷移を分けて管理する。

## As-Is（Phase1）

```mermaid
flowchart LR
  root["/"] --> login["01 Login (/login)"]
  login -->|ログイン成功| list["02 Ranking List (/rankings)"]

  subgraph Normal["通常利用クラスタ"]
    list --> create["03 Ranking Create/Edit (/rankings/new)"]
    list --> detail["04 Ranking Detail (/rankings/:id)"]
    list --> search["05 Tag Search (/search)"]
    list --> drafts["06 Drafts (/drafts)"]
    list --> settings["07 Settings (/settings)"]
    settings --> settingsLogout["07a Logout Confirm (/settings/logout)"]
    settings -->|ログアウト即時| login
    settingsLogout -->|ログアウト確定| login
    settingsLogout -->|キャンセル| settings

    create -->|作成成功| detail
    create -->|下書き保存| drafts
    create -->|キャンセル| list

    detail --> edit["03 Ranking Create/Edit (/rankings/:id/edit)"]
    detail --> del["08 Delete Confirmation (/rankings/:id/delete)"]
    detail -->|戻る| list
    edit -->|更新/キャンセル| detail
    del -->|削除| list
    del -->|キャンセル| detail

    search -->|検索結果詳細| detail
    drafts -->|新規作成| create
    drafts -->|下書き編集| create
  end

  subgraph State["状態検証クラスタ（AppShellのDevフラグ表示）"]
    s09["09 Empty List State"]
    s10["10 Empty Search State"]
    s11["11 Empty Drafts State"]
    s12["12 Error States"]
    s13["13 Loading State"]
    s14["14 Auth Error State"]
    s15["15 Not Found State"]
    s16["16 Draft Limit Reached"]
    s17["17 Toast States"]
    s18["18 State Transition Check"]
    s19["19 Common Header"]
  end

  list -. state=empty .-> s09
  list -. state=loading .-> s13
  list -. state=error .-> s12
  search -. 空結果検証 .-> s10
  drafts -. 空状態検証 .-> s11
  login -. 認証失敗 .-> s14
  list -. 404/導線確認 .-> s15
  drafts -. 上限到達確認 .-> s16
  list -. Toast挙動確認 .-> s17
  list -. 遷移整合確認 .-> s18
  settings -. ヘッダー導線確認 .-> s19

  list -. 未認証時リダイレクト .-> login
  create -. 未認証時リダイレクト .-> login
  detail -. 未認証時リダイレクト .-> login
```

## To-Be（継続率優先SNS導線）

```mermaid
flowchart LR
  login["Login"] --> onboarding["Onboarding"]
  onboarding --> home["Home Feed"]

  subgraph Core["コア導線"]
    home --> composer["Composer"]
    composer --> preview["Publish Preview"]
    preview --> post["Post Detail"]
    post --> home

    home --> post
    post --> reaction["Reaction/Save"]
    reaction --> home

    post --> profile["Profile"]
    profile --> follow["Follow"]
    follow --> following["Following Feed"]
    following --> post

    home --> noti["Notifications"]
    noti --> post
    noti --> profile
    drafts["Drafts"] --> composer
  end

  subgraph Loop["Growth Loop"]
    g1["投稿"]
    g2["反応獲得"]
    g3["通知"]
    g4["再訪"]
    g5["再投稿"]
    g1 --> g2 --> g3 --> g4 --> g5 --> g1
  end

  post --> g2
  noti --> g3
  home --> g4
  composer --> g1
```

## 遷移ルール（実装同期用）

| ルール | 内容 |
|---|---|
| 入口 | `/` は `/login` にリダイレクト |
| 認証 | 未認証時は `AppShell` で `/login` へリダイレクト |
| 一覧起点 | `/rankings` から作成・詳細・検索・下書き・設定へ遷移 |
| 作成導線 | `/rankings/new` は公開成功で詳細、下書き保存で下書き、キャンセルで一覧 |
| 詳細導線 | `/rankings/:id` から編集・削除確認・一覧戻り |
| 設定導線 | `/settings` から `/settings/logout`、またはログアウト |
| 状態画面 | `09-19` は本番主導線ではなく検証導線として別クラスタ管理 |
| クエリ遷移 | `state=*` への遷移は Mermaid で点線表現 |

## 運用メモ

- 状態画面ナビは `NEXT_PUBLIC_SHOW_STATE_SCREENS`（または開発環境）で表示。
- SNS拡張導線は `NEXT_PUBLIC_ENABLE_SNS_EXPANSION=true` で有効化。
