import * as PopoverPrimitive from '@radix-ui/react-popover';
import {cn} from '../../lib/utils';
export const Popover=PopoverPrimitive.Root;
export const PopoverAnchor=PopoverPrimitive.Anchor;
export const PopoverClose=PopoverPrimitive.Close;
export function PopoverContent({className,align='center',sideOffset=10,...props}){return <PopoverPrimitive.Portal><PopoverPrimitive.Content data-slot="popover-content" align={align} sideOffset={sideOffset} collisionPadding={16} updatePositionStrategy="always" className={cn('spot-popover',className)} {...props}/></PopoverPrimitive.Portal>;}
