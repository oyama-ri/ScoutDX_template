import {
  approveByManager,
  approveBySales,
  canActionByRoleAndStatus,
  canTransition,
  getInvalidTransitionReason,
  getNextStatusByAction,
  rejectByManager,
  rejectBySales,
  ScoutAction,
  ScoutStatus,
  submitByCreator,
  UserRole,
} from './statusうウェイター';

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: expected=${String(expected)} actual=${String(actual)}`);
  }
}

function runStatusTransitionTests(): void {
  // 正常系: 申請で DRAFT -> PENDING_SALES
  assertEqual(
    getNextStatusByAction(ScoutStatus.DRAFT, ScoutAction.SUBMIT, UserRole.CREATOR),
    ScoutStatus.PENDING_SALES,
    'CREATOR submit from DRAFT should move to PENDING_SALES',
  );

  // 正常系: 営業承認で PENDING_SALES -> PENDING_MANAGER
  assertEqual(
    getNextStatusByAction(
      ScoutStatus.PENDING_SALES,
      ScoutAction.SALES_APPROVE,
      UserRole.SALES_APPROVER,
    ),
    ScoutStatus.PENDING_MANAGER,
    'SALES_APPROVER approve should move to PENDING_MANAGER',
  );

  // 異常系: DRAFT から管理者承認は不可
  assertEqual(
    getNextStatusByAction(ScoutStatus.DRAFT, ScoutAction.MANAGER_APPROVE, UserRole.ADMIN),
    null,
    'ADMIN approve from DRAFT should be rejected',
  );

  // canTransition の正常/異常確認
  assertEqual(
    canTransition(ScoutStatus.PENDING_MANAGER, ScoutStatus.AVAILABLE),
    true,
    'PENDING_MANAGER -> AVAILABLE should be transitionable',
  );
  assertEqual(
    canTransition(ScoutStatus.AVAILABLE, ScoutStatus.DRAFT),
    false,
    'AVAILABLE -> DRAFT should not be transitionable',
  );

  // ロール・アクション・ステータスの事前判定
  assertEqual(
    canActionByRoleAndStatus(UserRole.CREATOR, ScoutAction.SUBMIT, ScoutStatus.REJECTED),
    true,
    'CREATOR submit from REJECTED should be allowed',
  );
  assertEqual(
    canActionByRoleAndStatus(UserRole.CREATOR, ScoutAction.MANAGER_APPROVE, ScoutStatus.PENDING_MANAGER),
    false,
    'CREATOR cannot perform manager approve',
  );

  // 不正遷移理由の確認
  assertEqual(
    getInvalidTransitionReason(UserRole.CREATOR, ScoutAction.MANAGER_APPROVE, ScoutStatus.PENDING_MANAGER),
    'このロールでは実行できない操作です。',
    'role-action mismatch reason should be returned',
  );
  assertEqual(
    getInvalidTransitionReason(UserRole.ADMIN, ScoutAction.MANAGER_APPROVE, ScoutStatus.DRAFT),
    '現在のステータスではこの操作を実行できません。',
    'status mismatch reason should be returned',
  );

  // 画面イベント向け関数の確認（作成者申請）
  const submitResult = submitByCreator(ScoutStatus.DRAFT);
  assertEqual(submitResult.nextStatus, ScoutStatus.PENDING_SALES, 'submitByCreator should move to PENDING_SALES');
  assertEqual(submitResult.errorMessage, null, 'submitByCreator success should not have error');

  // 画面イベント向け関数の確認（営業承認/差戻し）
  assertEqual(
    approveBySales(ScoutStatus.PENDING_SALES).nextStatus,
    ScoutStatus.PENDING_MANAGER,
    'approveBySales should move to PENDING_MANAGER',
  );
  assertEqual(
    rejectBySales(ScoutStatus.PENDING_SALES).nextStatus,
    ScoutStatus.REJECTED,
    'rejectBySales should move to REJECTED',
  );

  // 画面イベント向け関数の確認（管理者承認/差戻し）
  assertEqual(
    approveByManager(ScoutStatus.PENDING_MANAGER).nextStatus,
    ScoutStatus.AVAILABLE,
    'approveByManager should move to AVAILABLE',
  );
  assertEqual(
    rejectByManager(ScoutStatus.PENDING_MANAGER).nextStatus,
    ScoutStatus.REJECTED,
    'rejectByManager should move to REJECTED',
  );
}

runStatusTransitionTests();
