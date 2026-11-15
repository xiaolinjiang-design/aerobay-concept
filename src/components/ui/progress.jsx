import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../../lib/utils';
export function Progress({ className, value, ...props }) { return <ProgressPrimitive.Root data-slot="progress" className={cn('ui-progress',className)} value={value} {...props}><ProgressPrimitive.Indicator data-slot="progress-indicator" className="ui-progress-indicator" style={{transform:`translateX(-${100-(value||0)}%)`}}/></ProgressPrimitive.Root>; }
