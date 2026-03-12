/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Figma Make UIコンポーネントの型スタブ。
 * 実体はFigma Make側が管理するため、ここでは型エラーを抑制するだけ。
 */

declare module "*/ui/button" {
  export const Button: React.FC<any>;
}

declare module "*/ui/card" {
  export const Card: React.FC<any>;
  export const CardContent: React.FC<any>;
}

declare module "*/ui/badge" {
  export const Badge: React.FC<any>;
}

declare module "*/ui/input" {
  export const Input: React.FC<any>;
}

declare module "*/ui/label" {
  export const Label: React.FC<any>;
}

declare module "*/ui/select" {
  export const Select: React.FC<any>;
  export const SelectContent: React.FC<any>;
  export const SelectItem: React.FC<any>;
  export const SelectTrigger: React.FC<any>;
  export const SelectValue: React.FC<any>;
}
