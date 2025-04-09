import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ComponentPayout from '@/components/payout/component-payout';

async function page({
    searchParams
}) {
    const access_token = cookies().get('access_token')?.value
    const A
    const token=cookies().get('token')?.value
    const APP_PASSWORD = process.env.APP_PASSWORD
    
    return (
        <div>
            <ComponentPayout/>
        </div>
    );
}

export default page;a