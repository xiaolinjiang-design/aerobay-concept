import {cn} from '../../lib/utils';
export function Avatar({className,...props}){return <span data-slot="avatar" className={cn('ui-avatar',className)} {...props}/>;}
export function AvatarFallback({className,...props}){return <span data-slot="avatar-fallback" className={cn('ui-avatar-fallback',className)} {...props}/>;}
