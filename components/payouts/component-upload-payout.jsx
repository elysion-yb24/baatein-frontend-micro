'use client'
import { useState } from "react";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Cookies from "universal-cookie";
import Loading from "../layouts/loading";
import { post } from "@/utils";
function ComponentUploadPayout({ appPassword }) {
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
        try {
            e.preventDefault();
    
            let validate = await validatePassword();

            if (!validate) throw new Error('Password is incorrect');

            setLoading(true);

            let blob = await post(`/payment/api/admin/update-payout-details`, cookies.get('access_token'), { blob: true });
            if (blob) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `payouts-${date}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            setTimeout(() => {
                setLoading(false);
            }, 1000)

        } catch (err) {
            MySwal.fire({
                title: 'Error',
                text: err.message || 'Error',
                icon: 'error',
                confirmButtonText: 'Ok',
            })
            console.error('err', err);
        }
    }

    if (isLoading) return <Loading />
    return (
        <div>
            <h5 className="mb-5 text-lg font-semibold dark:text-white-light m-2">Upload Payout Sheet</h5>

            <form className="mx-auto w-full mb-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <h1 className = "font-bold">Make Sure that userId,UTR_NO,Amount_Paid,Status Columns are there</h1>
                        <input type="file" accept=".xls,.xlsx" />
                    </div>
                    <div className="flex justify-center mt-2">
                        <button
                            className="bg-primary text-white p-2 font-bold rounded-md"
                            type="submit"
                            disabled={isLoading}
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </form>

        </div>
    );
}

export default ComponentUploadPayout;