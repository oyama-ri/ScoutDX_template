import {
  approveByManager,
  approveBySales,
  canActionByRoleAndStatus,
  canEditByCreator,
  rejectByManager,
  rejectBySales,
  StatusTransitionResult,
  submitByCreator,
  UserRole,
} from './statusうウェイター';

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

export type CreatorSubmitOrSaveAction = 'submit' | 'save';

const MESSAGE_SAVE_NOT_ALLOWED = 'この状態では一時保存できません。';

// なぜ: フロント画面の保存処理を status.ts の正規ロジックに接続し、実装の重複を防ぐため。
// いつ: S05 の「承認申請」「一時保存」ボタン押下時に呼ぶ。
export function submitOrSaveScout(
  currentStatus: ScoutStatus,
  action: CreatorSubmitOrSaveAction,
): StatusTransitionResult {
  if (action === 'submit') {
    return submitByCreator(currentStatus);
  }

  if (!canEditByCreator(currentStatus)) {
    return {
      nextStatus: null,
      errorMessage: MESSAGE_SAVE_NOT_ALLOWED,
    };
  }

  return {
    nextStatus: ScoutStatus.DRAFT,
    errorMessage: null,
  };
}

// なぜ: 営業承認者の承認処理を UI から 1 関数で呼べるようにし、呼び出しミスを防ぐため。
// いつ: S07 の「承認」ボタン押下時に呼ぶ。
export function approveScout(currentStatus: ScoutStatus): StatusTransitionResult {
  return approveBySales(currentStatus);
}

// なぜ: 営業承認者の差戻し処理を UI から 1 関数で呼べるようにし、呼び出しミスを防ぐため。
// いつ: S07 の「差戻し」ボタン押下時に呼ぶ。
export function returnScout(currentStatus: ScoutStatus): StatusTransitionResult {
  return rejectBySales(currentStatus);
}

// なぜ: 管理者の最終承認処理を UI から 1 関数で呼べるようにし、遷移先 AVAILABLE を固定するため。
// いつ: S07 の管理者「承認」ボタン押下時に呼ぶ。
export function approveScoutAsManager(currentStatus: ScoutStatus): StatusTransitionResult {
  return approveByManager(currentStatus);
}

// なぜ: 管理者の差戻し処理を UI から 1 関数で呼べるようにし、遷移先 REJECTED を固定するため。
// いつ: S07 の管理者「差戻し」ボタン押下時に呼ぶ。
export function returnScoutAsManager(currentStatus: ScoutStatus): StatusTransitionResult {
  return rejectByManager(currentStatus);
}

export interface HasScoutStatus {
  status: ScoutStatus;
}

// なぜ: 画面側のステート更新を純関数化し、状態管理ライブラリ依存を避けるため。
// いつ: API 成功後にローカルの対象アイテムへ次ステータスを反映するときに呼ぶ。
export function applyStatusTransition<T extends HasScoutStatus>(
  item: T,
  transition: StatusTransitionResult,
): T {
  if (transition.nextStatus === null) {
    return item;
  }

  return {
    ...item,
    status: transition.nextStatus,
  };
}

// なぜ: ボタン表示と実行可否の判定を揃え、押せるのに失敗する体験を減らすため。
// いつ: 画面描画時にロール別アクションボタンの活性/非活性を決めるときに呼ぶ。
export function canExecuteUiAction(
  role: UserRole,
  action: ScoutAction,
  status: ScoutStatus,
): boolean {
  return canActionByRoleAndStatus(role, action, status);
}
