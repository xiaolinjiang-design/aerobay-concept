import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';
const buttonVariants = cva('ui-button', { variants: { variant: { default: 'ui-button-primary', outline: 'ui-button-outline', ghost: 'ui-button-ghost', secondary: 'ui-button-secondary' }, size: { default: '', sm: 'ui-button-sm', icon: 'ui-button-icon' } }, defaultVariants: { variant: 'default', size: 'default' } });
function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
export { Button, buttonVariants };
