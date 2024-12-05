import ComponentPaymentDetails from '@/components/payment-details/component-payment-details';
import { buildQuery, getPaymentsList } from '@/utils';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
async function page({
    searchParams
}) {
    const access_token = cookies().get('access_token')?.value
    const token=cookies().get('token')?.value
    const APP_PASSWORD = process.env.APP_PASSWORD
    let searchParamsMissing=false;
    if(!searchParams.skip || !searchParams.limit){
        searchParamsMissing=true
        if(!searchParams.skip) searchParams.skip=0
        if(!searchParams.limit) searchParams.limit=10
    }
    const queryString=buildQuery(searchParams)

    if(searchParamsMissing){
        redirect('payment-details?'+queryString)
    }
    const paymentListData=await getPaymentsList(`/user/api/admin/list-to-approve-payment-details?${queryString}`,access_token,token)
    return (
        <div>
            <ComponentPaymentDetails paymentDetails={paymentListData} appPassword={APP_PASSWORD}/>
        </div>
    );
}

export default page;