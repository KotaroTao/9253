/**
 * メールテンプレートの型定義とデフォルト値
 *
 * PlatformSetting (key: "emailTemplates") に保存されるカスタムテンプレート。
 * 未保存の場合は DEFAULT_*_TEMPLATE をフォールバックとして使用する。
 */

export const SETTING_KEY = "emailTemplates"

export interface EmailTemplateStep {
  title: string
  description: string
}

export interface VerificationEmailTemplate {
  subject: string
  greeting: string
  body: string
  note: string
}

export interface WelcomeEmailTemplate {
  subject: string
  greeting: string
  body: string
  note: string
  steps?: EmailTemplateStep[]
}

export interface EmailTemplatesSettingValue {
  verification: VerificationEmailTemplate
  welcome: WelcomeEmailTemplate
}

export const DEFAULT_VERIFICATION_TEMPLATE: VerificationEmailTemplate = {
  subject: "【MIERU Clinic】メールアドレスの確認",
  greeting: "MIERU Clinic にご登録いただきありがとうございます。",
  body: "以下のボタンをクリックして、メールアドレスの確認を完了してください。",
  note: "このメールに心当たりがない場合は、このメールを無視してください。",
}

export const DEFAULT_WELCOME_TEMPLATE: WelcomeEmailTemplate = {
  subject: "【MIERU Clinic】ご利用開始ガイド",
  greeting: "メールアドレスの確認が完了しました。MIERU Clinic をご利用いただけます。",
  body: "",
  note: "ご不明な点がございましたら、使い方ガイドをご覧ください。",
  steps: [
    { title: "スタッフを登録する", description: "ダッシュボード → スタッフ管理 から追加できます" },
    { title: "テストアンケートを試す", description: "ダッシュボード → テスト から、実際の画面を確認できます" },
    { title: "初回アンケートを実施", description: "受付のタブレットでアンケート画面を開き、患者さまにお渡しください" },
  ],
}
