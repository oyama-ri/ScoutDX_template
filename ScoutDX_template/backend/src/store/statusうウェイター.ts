// スカウト文のワークフロー状態。
// DB の status カラムや API レスポンスの status 値として扱う。
export enum ScoutStatus {
  DRAFT = 'DRAFT',
  PENDING_SALES = 'PENDING_SALES',
  PENDING_MANAGER = 'PENDING_MANAGER',
  REJECTED = 'REJECTED',
  AVAILABLE = 'AVAILABLE',
}

// 画面操作や承認処理で発生するアクション種別。
export enum ScoutAction {
  SUBMIT = 'SUBMIT',
  SALES_APPROVE = 'SALES_APPROVE',
  SALES_REJECT = 'SALES_REJECT',
  MANAGER_APPROVE = 'MANAGER_APPROVE',
  MANAGER_REJECT = 'MANAGER_REJECT',
}

// ステータス遷移の権限判定に使うロール。
export enum UserRole {
  CREATOR = 'CREATOR',
  SALES_APPROVER = 'SALES_APPROVER',
  ADMIN = 'ADMIN',
}

// ScoutStatus の全値集合。
// const SCOUT_STATUS_SET: ReadonlySet<ScoutStatus> = new Set(Object.values(ScoutStatus));

// 受け取った status 入力値が ScoutStatus のいずれかと一致するかを判定する。
// いつ: API の作成/更新リクエストを保存前に検証するときに使う。
// export function isValidStatus(value: unknown): value is ScoutStatus {
//   if (typeof value !== 'string') {
//     return false;
//   }

//   return SCOUT_STATUS_SET.has(value as ScoutStatus);
// }

// 作成者（CREATOR）が編集可能な状態かを判定する。
// 下書き DRAFT と差し戻し REJECTED のみ再編集を許可する。
// いつ: 作成者向けの編集画面を開く前、または保存ボタン活性制御で使う。
export function canEditByCreator(status: ScoutStatus): boolean {
  if (status === ScoutStatus.DRAFT || status === ScoutStatus.REJECTED) {
    return true;
  }

  return false;
}

type TransitionRule = {
  role: UserRole;
  action: ScoutAction;
  from: readonly ScoutStatus[];
  to: ScoutStatus;
};

// なぜ: 画面や API が増えても同一ルールを参照し、判定の不整合を防ぐため。
// いつ: ステータス遷移ロジックを追加/変更するときにこの定義を更新する。
const TRANSITION_RULES: readonly TransitionRule[] = [
  {
    role: UserRole.CREATOR,
    action: ScoutAction.SUBMIT,
    from: [ScoutStatus.DRAFT, ScoutStatus.REJECTED],
    to: ScoutStatus.PENDING_SALES,
  },
  {
    role: UserRole.SALES_APPROVER,
    action: ScoutAction.SALES_APPROVE,
    from: [ScoutStatus.PENDING_SALES],
    to: ScoutStatus.PENDING_MANAGER,
  },
  {
    role: UserRole.SALES_APPROVER,
    action: ScoutAction.SALES_REJECT,
    from: [ScoutStatus.PENDING_SALES],
    to: ScoutStatus.REJECTED,
  },
  {
    role: UserRole.ADMIN,
    action: ScoutAction.MANAGER_APPROVE,
    from: [ScoutStatus.PENDING_MANAGER],
    to: ScoutStatus.AVAILABLE,
  },
  {
    role: UserRole.ADMIN,
    action: ScoutAction.MANAGER_REJECT,
    from: [ScoutStatus.PENDING_MANAGER],
    to: ScoutStatus.REJECTED,
  },
];

// なぜ: ロールが許可される操作を明示し、権限不備と状態不備の理由を分けて返すため。
// いつ: 権限エラーの説明を返す判定で使う。
const ROLE_ALLOWED_ACTIONS: Readonly<Record<UserRole, readonly ScoutAction[]>> = {
  [UserRole.CREATOR]: [ScoutAction.SUBMIT],
  [UserRole.SALES_APPROVER]: [ScoutAction.SALES_APPROVE, ScoutAction.SALES_REJECT],
  [UserRole.ADMIN]: [ScoutAction.MANAGER_APPROVE, ScoutAction.MANAGER_REJECT],
};

const MESSAGE_ACTION_NOT_ALLOWED = 'このロールでは実行できない操作です。';
const MESSAGE_STATUS_NOT_ALLOWED = '現在のステータスではこの操作を実行できません。';

// なぜ: canTransition の判定を role/action 判定と独立させ、一覧画面の事前表示にも再利用できるようにするため。
// いつ: 遷移候補の表示や、遷移可否の汎用チェックを行うときに使う。
const ALLOWED_TRANSITIONS: Readonly<Record<ScoutStatus, readonly ScoutStatus[]>> = {
  [ScoutStatus.DRAFT]: [ScoutStatus.PENDING_SALES],
  [ScoutStatus.PENDING_SALES]: [ScoutStatus.PENDING_MANAGER, ScoutStatus.REJECTED],
  [ScoutStatus.PENDING_MANAGER]: [ScoutStatus.AVAILABLE, ScoutStatus.REJECTED],
  [ScoutStatus.REJECTED]: [ScoutStatus.PENDING_SALES],
  [ScoutStatus.AVAILABLE]: [],
};

// 現在ステータス from から遷移先 to へ進めるかを判定する。
// 同一ステータスへの遷移は不可として false を返す。
// いつ: 画面で遷移先候補を出す前の事前チェックや、サービス層の防御的チェックで使う。
export function canTransition(from: ScoutStatus, to: ScoutStatus): boolean {
  if (from === to) {
    return false;
  }

  return ALLOWED_TRANSITIONS[from].includes(to);
}

// なぜ: UI 側でボタン活性制御を先に行い、無効操作の API 呼び出しを減らすため。
// いつ: 申請/承認/差戻しボタンの disabled 判定を行うときに使う。
export function canActionByRoleAndStatus(
  role: UserRole,
  action: ScoutAction,
  status: ScoutStatus,
): boolean {
  const nextStatus = getNextStatusByAction(status, action, role);
  return nextStatus !== null;
}

// なぜ: 不正遷移時の理由を統一し、画面ごとの文言揺れを防ぐため。
// いつ: 操作失敗時にトーストやエラーバナーへ表示する理由を決めるときに使う。
export function getInvalidTransitionReason(
  role: UserRole,
  action: ScoutAction,
  currentStatus: ScoutStatus,
): string | null {
  const allowedActions = ROLE_ALLOWED_ACTIONS[role];
  if (!allowedActions.includes(action)) {
    return MESSAGE_ACTION_NOT_ALLOWED;
  }

  const nextStatus = getNextStatusByAction(currentStatus, action, role);
  if (nextStatus === null) {
    return MESSAGE_STATUS_NOT_ALLOWED;
  }

  return null;
}

// 現在ステータス・実行アクション・実行者ロールから次ステータスを決定する。
// 条件に合う組み合わせのみ次ステータスを返し、合わない場合は null（遷移不可）を返す。
// いつ: ボタン押下時の状態更新処理で、保存する次ステータスを決定するときに使う。
export function getNextStatusByAction(
  currentStatus: ScoutStatus,
  action: ScoutAction,
  role: UserRole,
): ScoutStatus | null {
  const matchedRule = TRANSITION_RULES.find(
    (rule) => rule.role === role && rule.action === action,
  );
  if (!matchedRule) {
    return null;
  }

  if (!matchedRule.from.includes(currentStatus)) {
    return null;
  }

  if (!canTransition(currentStatus, matchedRule.to)) {
    return null;
  }

  return matchedRule.to;
}

export interface StatusTransitionResult {
  nextStatus: ScoutStatus | null;
  errorMessage: string | null;
}

// なぜ: S05「承認申請」操作の更新処理を role/action 指定ミスなく呼ぶため。
// いつ: 作成者が承認申請ボタンを押した直後の状態更新で使う。
export function submitByCreator(currentStatus: ScoutStatus): StatusTransitionResult {
  const action = ScoutAction.SUBMIT;
  const role = UserRole.CREATOR;
  const nextStatus = getNextStatusByAction(currentStatus, action, role);
  if (nextStatus === null) {
    return {
      nextStatus: null,
      errorMessage: getInvalidTransitionReason(role, action, currentStatus),
    };
  }

  return { nextStatus, errorMessage: null };
}

// なぜ: S07 営業承認者の「承認」操作を単一関数に閉じ、画面実装を簡潔にするため。
// いつ: 営業承認者が承認ボタンを押したときの状態更新で使う。
export function approveBySales(currentStatus: ScoutStatus): StatusTransitionResult {
  const action = ScoutAction.SALES_APPROVE;
  const role = UserRole.SALES_APPROVER;
  const nextStatus = getNextStatusByAction(currentStatus, action, role);
  if (nextStatus === null) {
    return {
      nextStatus: null,
      errorMessage: getInvalidTransitionReason(role, action, currentStatus),
    };
  }

  return { nextStatus, errorMessage: null };
}

// なぜ: S07 営業承認者の「差戻し」操作を承認と対で管理し、分岐漏れを防ぐため。
// いつ: 営業承認者が差戻しボタンを押したときの状態更新で使う。
export function rejectBySales(currentStatus: ScoutStatus): StatusTransitionResult {
  const action = ScoutAction.SALES_REJECT;
  const role = UserRole.SALES_APPROVER;
  const nextStatus = getNextStatusByAction(currentStatus, action, role);
  if (nextStatus === null) {
    return {
      nextStatus: null,
      errorMessage: getInvalidTransitionReason(role, action, currentStatus),
    };
  }

  return { nextStatus, errorMessage: null };
}

// なぜ: S07 管理者の最終承認を専用化し、AVAILABLE 遷移条件を一元化するため。
// いつ: 管理者が最終承認ボタンを押したときの状態更新で使う。
export function approveByManager(currentStatus: ScoutStatus): StatusTransitionResult {
  const action = ScoutAction.MANAGER_APPROVE;
  const role = UserRole.ADMIN;
  const nextStatus = getNextStatusByAction(currentStatus, action, role);
  if (nextStatus === null) {
    return {
      nextStatus: null,
      errorMessage: getInvalidTransitionReason(role, action, currentStatus),
    };
  }

  return { nextStatus, errorMessage: null };
}

// なぜ: S07 管理者の差戻しを専用化し、却下時の戻し先 REJECTED を固定するため。
// いつ: 管理者が差戻しボタンを押したときの状態更新で使う。
export function rejectByManager(currentStatus: ScoutStatus): StatusTransitionResult {
  const action = ScoutAction.MANAGER_REJECT;
  const role = UserRole.ADMIN;
  const nextStatus = getNextStatusByAction(currentStatus, action, role);
  if (nextStatus === null) {
    return {
      nextStatus: null,
      errorMessage: getInvalidTransitionReason(role, action, currentStatus),
    };
  }

  return { nextStatus, errorMessage: null };
}
