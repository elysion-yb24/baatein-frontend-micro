'use client'
import { DataTable } from "mantine-datatable";
import IconCaretDown from '@/components/icon/icon-caret-down';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { post, updateApproveorDecline } from "@/utils";
import Cookies from "universal-cookie";

function ComponentPaymentDetails({ paymentDetails ,appPassword}) {
    const [isLoading, setLoading] = useState(true)
    const [disabled, setDisabled] = useState(false)
    const [initialRecords, setInitialRecords] = useState(paymentDetails?.data || []);
    const isRtl = useSelector((state) => state.themeConfig.rtlClass) === 'rtl';
    const [isMounted, setIsMounted] = useState(false);
    const searchParams = useSearchParams();
    const pathName = usePathname();
    const MySwal = withReactContent(Swal);
    const router = useRouter();

    const [formData, setFormData] = useState({
        skip: Number(searchParams.get('skip')) || 0,
        limit: 10
    })


    const roleStatusColor = (role) => {
        const color = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
        role = role.toLowerCase();
        if (role === "completed") return color[2];
        else if(role === "failed") return color[3];
        else if (role === "pending") return color[1];
        else return color[5];
    };
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleQuery = (paramsFormData) => {
        try {
            setLoading(true)
            const params = new URLSearchParams(searchParams)
            for (let key in paramsFormData) {
                params.set(key, paramsFormData[key])
            }
            router.push(`${pathName}?${params.toString()}`, { scroll: false })
            setTimeout(() => {
                setLoading(false)
            }, 1000)
        } catch (err) {
            alert('err', err)
            setLoading(false)
        }
    }

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

    const approveorDecline = async (userId, isApproved) => {
        try {
            setDisabled(true);
            let validate=await validatePassword();

            if(!validate) throw new Error('Password is incorrect');

            const cookies = new Cookies(null, { path: '/' })
            const access_token = cookies.get('access_token')
            let body = {
                userId,
                isApproved
            }
            const apiRes = await updateApproveorDecline('/user/api/admin/approve-payment-details', access_token, body)
            if (apiRes.success) {
                MySwal.fire({
                    title: 'Success',
                    text: apiRes.message,
                    icon: 'success',
                    confirmButtonText: 'Ok',
                })
            } else {
                MySwal.fire({
                    title: 'Error',
                    text: apiRes.message,
                    icon: 'error',
                    confirmButtonText: 'Ok',
                })
            }
        }
        catch (err) {
            console.log(err);
            MySwal.fire({
                title: 'Error',
                text: err,
                icon: 'error',
                confirmButtonText: 'Ok',
            })
        } finally {
            router.refresh();
            setDisabled(false);
        }
    }

    const validatePaymentDetails=async(user,details)=>{
        try{
            setDisabled(true);
            const cookies = new Cookies(null, { path: '/' })
            const access_token = cookies.get('access_token')
            let validateResult=await post("/user/api/details/validate-details",access_token,{
                "userId":user?._id,
                "name":user?.name,
                "phone":user?.phone,
                ...details
            })
        }catch(err){
            console.log(err);
        }finally{
            router.refresh();
            setDisabled(false);
        }
    }

    useEffect(() => {
        setInitialRecords(paymentDetails?.data || []);
        setLoading(false)
    }, [paymentDetails])

    return (
        <div>

            <div className="datatables">
                {isMounted && (
                    <DataTable
                        noRecordsText="No results match your search query"
                        highlightOnHover
                        className="table-hover whitespace-nowrap"
                        records={initialRecords}
                        columns={[

                            {
                                accessor: 'name',
                                title: 'Name',
                                sortable: true,
                                render: ({ userId }) => {
                                    return (
                                        <div className="flex items-center gap-2">
                                            <div>{userId?.name}</div>
                                        </div>
                                    )
                                },
                            },
                            {
                                accessor: 'phone',
                                title: 'Phone',
                                sortable: true,
                                render: ({ userId }) => {
                                    return (
                                        <div className="flex items-center gap-2">
                                            <div>{userId?.phone}</div>
                                        </div>
                                    )
                                },
                            },
                            {
                                accessor: 'bankAccountNumber',
                                title: 'Acc No',
                                sortable: true,
                                render: ({ bankAccountNumber }) => (
                                    <div className="flex items-center gap-2">
                                        <div>{bankAccountNumber || 'N/A'}</div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'ifscCode',
                                title: 'IFSC',
                                render: ({ ifscCode }) => <div className="flex items-center gap-2">
                                    <div>{ifscCode || 'N/A'}</div>
                                </div>
                            },
                            {
                                accessor: 'accountHolderName',
                                title: 'Acc Name',
                                render: ({ accountHolderName }) => (
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold">{accountHolderName || 'N/A'}</div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'upi',
                                title: 'Upi',
                                render: ({ upi }) => <div className="flex items-center gap-2">
                                    <strong className="font-bold">{upi || 'N/A'}</strong>
                                </div>,
                            },
                            {
                                accessor: 'validationName',
                                title: 'Validation Name',
                                render: ({ vpa,account }) => <div className="flex items-center gap-2">
                                    <strong className="font-bold">{vpa?.vpaName || account?.accountName || 'N/A'}</strong>
                                </div>,
                            },
                            {
                                accessor: 'status',
                                title: 'Validation Status',
                                render: ({ upi, vpa, account }) => {
                                    let status="pending";
                                    if(upi){
                                        if(vpa && vpa.status){
                                            if(vpa.status!="") status=vpa.status
                                        } 
                                    } 
                                    else if(bankAccountNumber){
                                        if(account && account.status){
                                            if(account.status!="") status=account.status
                                        }
                                    }

                                    return (<div className="flex items-center justify-center">
                                        <span className={`badge bg-${roleStatusColor(status)} rounded-full`}>{status}</span>
                                    </div>)
                                }

                            },
                            {
                                accessor: 'action',
                                title: 'Action',
                                render: ({ userId, upi, vpa, account ,bankAccountNumber}) => {
                                    let status="pending";
                                    if(upi){
                                        if(vpa && vpa.status){
                                            if(vpa.status!="") status=vpa.status
                                        } 
                                    } 
                                    else if(bankAccountNumber){
                                        if(account && account.status){
                                            if(account.status!="") status=account.status
                                        }
                                    }

                                    let approveDisabled=true;
                                    let declineDisabled=true;
                                    if (upi) {
                                        approveDisabled=(vpa?.status == "completed") ? false : true
                                        declineDisabled=(vpa?.status == "completed" || vpa?.status=="failed")? false :true
                                        
                                    } else if(bankAccountNumber){
                                        approveDisabled=(account?.status == "completed")? false : true
                                        declineDisabled=(account?.status == "completed" || account?.status=="failed")? false :true
                                        
                                    }

                                    if(status=="pending"){
                                        return <>
                                        <div className="flex items-center justify-space-between ">
                                            <button className="bg-success text-white p-2 rounded m-2 disabled btn" disabled={true}>Approve</button>
                                            <button className="bg-danger text-white p-2 rounded m-2 disabled btn" disabled={true}>Decline</button>
                                        </div>
                                        </>
                                    }
                                    else {
                                        return <>
                                            <div className="flex items-center justify-space-between ">
                                                <button className="bg-success text-white p-2 rounded m-2 btn" onClick={() => approveorDecline(userId?._id, true)} disabled={disabled || approveDisabled}>Approve</button>
                                                <button className="bg-danger text-white p-2 rounded m-2 btn" onClick={() => approveorDecline(userId?._id, false)} disabled={disabled || declineDisabled}>Decline</button>
                                            </div>
                                        </>
                                    }
                                }
                            },
                            {
                                accessor: 'validate',
                                title: 'Validate Details',
                                render: ({ upi, userId, bankAccountNumber,ifscCode,vpa,account}) => {
                                    let status="pending";
                                    if(upi){
                                        if(vpa && vpa.status){
                                            if(vpa.status!="") status=vpa.status
                                        } 
                                    } 
                                    else if(bankAccountNumber){
                                        if(account && account.status){
                                            if(account.status!="") status=account.status
                                        }
                                    }
                                    let details={};
                                    if(upi) details={type:"vpa",identifier:upi}
                                    else details={type:"account",identifier:bankAccountNumber,ifsc}
                                    return <>
                                        <button className="bg-primary text-white p-2 rounded m-2 btn" onClick={() => validatePaymentDetails(userId,details)} disabled={disabled || status!="pending"}>Validate</button>
                                    </>
                                }
                            },
                            {
                                accessor: 'updatedAt',
                                title: 'Last Updated',
                                sortable: true,
                                render: ({ updatedAt }) => {
                                    const tempDate = new Date(updatedAt);
                                    return <div className="flex items-center justify-center">
                                        <span className={`font-bold p-2`}>{tempDate.getDate() + '/' + (tempDate.getMonth() + 1) + '/' + tempDate.getFullYear() + ' ' + tempDate.getHours() + ':' + tempDate.getMinutes() + ':' + tempDate.getSeconds()}</span>
                                    </div>
                                }
                            }
                        ]}
                        idAccessor='_id'
                        fetching={isLoading}
                        // sortStatus={sortStatus}
                        // onSortStatusChange={setSortStatus}
                        minHeight={200}
                        emptyState={paymentDetails?.success === false ? <div>{paymentDetails?.message}</div> : <div>No records Found</div>}
                    />
                )}
            </div>

            {/* For pagination */}
            <ul className="inline-flex items-center space-x-1 rtl:space-x-reverse m-auto mt-4">
                {/* Prev button */}
                <li>
                    <button
                        type="button"
                        className={`flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary ${formData.skip === 0 && 'cursor-not-allowed hover:bg-primary-light'}`}
                        onClick={() => {
                            let updatedFormData = { ...formData, skip: Number(formData.skip) - 10 }
                            setFormData(updatedFormData);
                            handleQuery(updatedFormData);
                        }}
                        disabled={formData.skip === 0}
                    >
                        <IconCaretDown className="h-5 w-5 rotate-90 rtl:-rotate-90" />
                    </button>
                </li>

                {/* Next Button */}
                <li>
                    <button
                        type="button"
                        className={`flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary ${initialRecords.length < 10 && 'cursor-not-allowed hover:bg-primary-light'}`}
                        onClick={() => {
                            let updatedFormData = { ...formData, skip: Number(formData.skip) + 10 }
                            setFormData(updatedFormData);
                            handleQuery(updatedFormData);
                        }}
                        disabled={initialRecords.length < 10}
                    >
                        <IconCaretDown className="h-5 w-5 -rotate-90 rtl:rotate-90" />
                    </button>
                </li>
            </ul>
        </div>
    );
}

export default ComponentPaymentDetails;