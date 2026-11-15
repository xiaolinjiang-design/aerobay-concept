import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import {Check,ChevronDown,ChevronUp} from 'lucide-react';
export const Select=SelectPrimitive.Root;
export const SelectValue=SelectPrimitive.Value;
export const SelectTrigger=React.forwardRef(function SelectTrigger({children,...props},ref){return <SelectPrimitive.Trigger ref={ref} className="ui-select-trigger" {...props}>{children}<SelectPrimitive.Icon asChild><ChevronDown size={14}/></SelectPrimitive.Icon></SelectPrimitive.Trigger>});
export function SelectContent({children}){return <SelectPrimitive.Portal><SelectPrimitive.Content className="ui-select-content" position="popper" sideOffset={5} collisionPadding={12}><SelectPrimitive.ScrollUpButton className="ui-select-scroll"><ChevronUp size={13}/></SelectPrimitive.ScrollUpButton><SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport><SelectPrimitive.ScrollDownButton className="ui-select-scroll"><ChevronDown size={13}/></SelectPrimitive.ScrollDownButton></SelectPrimitive.Content></SelectPrimitive.Portal>}
export const SelectItem=React.forwardRef(function SelectItem({children,...props},ref){return <SelectPrimitive.Item ref={ref} className="ui-select-item" {...props}><SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText><SelectPrimitive.ItemIndicator className="ui-select-check"><Check size={13}/></SelectPrimitive.ItemIndicator></SelectPrimitive.Item>});
