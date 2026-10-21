import type { ButtonHTMLAttributes } from 'react';
import './PrimaryButton.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export default function PrimaryButton({ className, type = 'button', ...rest }: Props) {
  return <button type={type} className={`primary-button ${className ?? ''}`.trim()} {...rest} />;
}
