import ComponentGetPayout from '@/components/payouts/component-get-payout';
import ComponentUploadPayout from '@/components/payouts/component-upload-payout';
async function page() {

    const APP_PASSWORD = process.env.APP_PASSWORD

    // const paymentListData=await getPaymentsList(`/user/api/admin/list-to-approve-payment-details?${queryString}`,access_token,token)
    return (
        <div>
            <ComponentGetPayout appPassword={APP_PASSWORD}/>
            <ComponentUploadPayout/>
        </div>
    );
}

export default page;