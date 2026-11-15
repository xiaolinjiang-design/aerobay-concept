import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '../../lib/utils';
export function Separator({ className, orientation = 'horizontal', decorative = true, ...props }) { return <SeparatorPrimitive.Root data-slot="separator" decorative={decorative} orientation={orientation} className={cn('ui-separator', className)} {...props}/>; }
