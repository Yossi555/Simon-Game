import type { ComponentPropsWithRef } from 'react';
import './PrimaryButton.css';

type Props = ComponentPropsWithRef<'button'>;

export default function PrimaryButton({ className, type = 'button', ...rest }: Props) {
  return <button type={type} className={`primary-button ${className ?? ''}`.trim()} {...rest} />;
}
