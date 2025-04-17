'use client'
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { useSelector } from 'react-redux';
import { get } from '@/utils';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Cookies from 'universal-cookie';
import Loading from '@/components/layouts/loading';

function ComponentGetPayout({appPassword}) {
    const [date, setDate] = useState('');
    const searchParams = useSearchParams();
    const isRtl = useSelector((state) => state.themeConfig.rtlClass) === 'rtl';
    const [isLoading, setLoading] = useState(false)
    const MySwal = withReactContent(Swal);
    const cookies = new Cookies(null, { path: '/' })

    const validatePassword = async () => {
        const { value: password } = await Swal.fire({
            title: "Enter your password",
            input: "password",
            inputLabel: "Password",
            inputPlaceholder: "Enter your password",
            inputAttributes: {
              maxlength: "30",
              autocapitalize: "off",
              autocorrect: "off"
            }
          });
          if (password === appPassword) return true;
          return false;
    }
    const handleSubmit = async (e) => {
        try{
            e.preventDefault();
            if(!date) throw new Error('From Date is required');

            let validate=await validatePassword();

            if(!validate) throw new Error('Password is incorrect');

            setLoading(true);

            let blob=await get(`/payment/api/admin/get-payout-details?from=${date}`,cookies.get('access_token'),{blob:true});
            if (blob) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `payouts-${date}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            setTimeout(()=>{
                setLoading(false);
            },1000)

        }catch(err){
            MySwal.fire({
                title: 'Error',
                text: err.message || 'Error',
                icon: 'error',
                confirmButtonText: 'Ok',
            })
            console.error('err',err);
        }
    }
    useEffect(() => {
        if (searchParams.get('from')) setDate(searchParams.get('from'));
    }, [searchParams])

    if(isLoading) return <Loading/>
    return (
        <div>
            <h5 className="mb-5 text-lg font-semibold dark:text-white-light">Get Payout Sheet</h5>
            
            <form className="mx-auto w-full mb-5" onSubmit={handleSubmit}>
                <div className=' grid grid-cols-1 gap-4'>

                    <div>
                        <label>From :</label>
                        <Flatpickr
                            options={{
                                dateFormat: 'Y-m-d',
                                position: isRtl ? 'auto right' : 'auto left',

                            }}
                            value={date}
                            className="form-input"
                            onChange={([selectedDate]) => {
                                const formatDate = (date) => {
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    return `${year}-${month}-${day}`;
                                };
                                setDate(formatDate(selectedDate));
                            }}
                            required
                        />
                    </div>
                    <div className='flex justify-center mt-2'>
                        <button className='bg-primary text-white p-2 font-bold rounded-md ' type='submit' disabled={isLoading}>Submit</button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default ComponentGetPayout;