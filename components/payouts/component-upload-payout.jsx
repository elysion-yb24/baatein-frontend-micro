'use client';
import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import Cookies from "universal-cookie";
import Loading from "../layouts/loading";
import { post } from "@/utils";

function ComponentUploadPayout({ appPassword }) {
    const isRtl = useSelector((state) => state.themeConfig.rtlClass) === 'rtl';
    const [isLoading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const MySwal = withReactContent(Swal);
    const cookies = new Cookies(null, { path: '/' });

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
        return password === appPassword;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const validate = await validatePassword();
            if (!validate) throw new Error('Password is incorrect');

            const file = fileInputRef.current?.files?.[0];
            if (!file) throw new Error('Please select a file');

            const formData = new FormData();
            formData.append('file', file);

            setLoading(true);

            const blob = await post(
                `/payment/api/admin/update-payout-details`,
                cookies.get('access_token'),
                formData,
                { blob: true }
            );

            if (blob instanceof Blob) {
                const date = new Date().toISOString().split('T')[0]; // fallback for `date`
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = `payouts-${date}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                throw new Error("Invalid file response from server");
            }
        } catch (err) {
            MySwal.fire({
                title: 'Error',
                text: err.message || 'Something went wrong',
                icon: 'error',
                confirmButtonText: 'Ok',
            });
            console.error('Upload error:', err);
        } finally {
            setTimeout(() => setLoading(false), 1000);
        }
    };

    if (isLoading) return <Loading />;

    return (
        <div>
            <h5 className="mb-5 text-lg font-semibold dark:text-white-light m-2">Upload Payout Sheet</h5>
            <form className="mx-auto w-full mb-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <h1 className="font-bold">Make sure that userId, UTR_NO, Amount_Paid, Status columns are present</h1>
                        <input type="file" accept=".xls,.xlsx" ref={fileInputRef} />
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
