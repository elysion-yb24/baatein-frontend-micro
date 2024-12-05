import ComponentUpdateNormalUser from '@/components/users/update-users/components-update-normal-user';
import { buildQuery, getNormalUsers } from '@/utils';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function page({
    searchParams
}) {
    const access_token = cookies().get('access_token')?.value
    const refresh_token = cookies().get('token')?.value;
    const queryString = buildQuery(searchParams)
    const APP_PASSWORD=process.env.APP_PASSWORD
    const userData = await getNormalUsers(`/user/api/admin/get-users-admin?${queryString}`, access_token, refresh_token)
    // console.log('userData', userData)
    return <ComponentUpdateNormalUser userData={userData} appPassword={APP_PASSWORD}/>
}

export default page;