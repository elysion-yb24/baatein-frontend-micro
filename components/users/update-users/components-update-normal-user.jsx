'use client';
import IconX from '@/components/icon/icon-x';
import { getUserInterests, userOnboardingApi } from '@/utils';
import { Dialog, Transition } from '@headlessui/react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import React, { Fragment, use, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import Asyncselect from 'react-select/async'
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Cookies from 'universal-cookie';

const ComponentUpdateNormalUser = ({ userData ,appPassword}) => {
    const {data:adminData} = useSelector(store => store?.user)
    const [userId, setUserId] = useState('');
    const cookies = new Cookies(null, { path: '/' });
    const [formData, setFormData] = useState(null);
    const MySwal = withReactContent(Swal);
    const [modal1, setModal1] = useState(false);
    const statusOptions = [
        { value: 'online', label: 'Online' },
        { value: 'offline', label: 'Offline' },
        { value: 'ogbusy', label: 'Busy' }
    ]
    const searchParams = useSearchParams();
    const { push, refresh } = useRouter();
    const pathname = usePathname();
    const [formValues, setFormValues] = useState(null)

    const numberInputOnWheelPreventChange = (e) => {
        // Prevent the input value change
        e.target.blur()
    
        // Prevent the page/container scrolling
        e.stopPropagation()
    
        // Refocus immediately, on the next tick (after the current     
        // function is done)
        setTimeout(() => {
            e.target.focus()
        }, 0)
    }

    const handleUpdate = async (e) => {
        e.preventDefault();
        let currentFormData = new FormData(e.target)
        setFormData(currentFormData)
        setModal1(true);
    }

    const handleConfirmUpdate = async () => {
        try {
            setModal1(false);

            if(adminData?.permissions?.updatePaymentDetails){
                let validate=await validatePassword();
                if(!validate) throw new Error('Password is incorrect');
            }
            
            if(!adminData) {
                cookies.remove('access_token');
                cookies.remove('token');
                MySwal.fire({
                    title: 'Please Login in Again',
                    text: err,
                    icon: 'error',
                    confirmButtonText: 'Ok',
                })
                replace('/auth/login');
                return;
            }
            
            if (formData.get('isVideoCallAllowed') === 'on') formData.set('isVideoCallAllowed', true)
            if (formData.get('isVideoCallAllowedAdmin') === 'on') formData.set('isVideoCallAllowedAdmin', true)

            if (!formData.get('isVideoCallAllowed')) formData.set('isVideoCallAllowed', false);
            if (!formData.get('isVideoCallAllowedAdmin')) formData.set('isVideoCallAllowedAdmin', false);

            if (formData.get('sample').name === '') formData.delete('sample')
            if (formData.get('avatar').name === '') formData.delete('avatar')

            formData.append('password', "Sarthak1singhal@");
            const apiData = await userOnboardingApi('/user/api/admin/update-people', formData, cookies.get('access_token'))

            if (apiData?.success) {
                MySwal.fire({
                    title: apiData?.message,
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 3000,
                    showCloseButton: true,
                    background: 'green'
                });
                refresh()
            } else {
                MySwal.fire({
                    title: apiData?.message,
                    toast: true,
                    position: 'top',
                    showConfirmButton: false,
                    timer: 3000,
                    showCloseButton: true,
                    background: 'red'
                });
            }
        } catch (err) {
            // console.log('Err in handleConfirmUpdate', err)
            MySwal.fire({
                title: 'Error',
                text: err,
                icon: 'error',
                confirmButtonText: 'Ok',
            })
        }finally{
            refresh();
        }
    }


    const handleQuery = (paramsFormData) => {
        try {

            const params = new URLSearchParams(searchParams)
            for (let key in paramsFormData) {
                params.set(key, paramsFormData[key])
            }
            push(`${pathname}?${params.toString()}`, { scroll: false })

        } catch (err) {
            console.log('err', err);
            alert('err', err)
        }
    }
    const handleSearch = (e) => {
        e.preventDefault();
        handleQuery({ userId })
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

    const promiseOptionsInterests = async () => {
        try {
            const cookies = new Cookies(null, { path: '/' })
            const apiData = await getUserInterests('/user/api/admin/get-interests', cookies.get('access_token'))
            return apiData?.data?.talksAbout ? apiData?.data?.talksAbout : [];
        } catch (err) {
            console.log('err in promiseOptionsInterests', err)
            return [];
        }
    }

    const promiseOptionsLanguages = async () => {
        try {

            const cookies = new Cookies(null, { path: '/' })
            const apiData = await getUserInterests('/user/api/admin/get-interests', cookies.get('access_token'))
            return apiData?.data?.languages ? apiData?.data?.languages : [];
        } catch (err) {
            console.log('err in promiseOptionsLanguages', err)
            return [];
        }
    }

    const updateUserData = (userData) => {
        let languageArray = userData?.data?.user[0]?.language;
        let interestArray = userData?.data?.user[0]?.talksAbout;
        languageArray = languageArray?.map((item) => {
            return { value: item, label: item }
        })
        interestArray = interestArray?.map((item) => {
            return { value: item, label: item }
        })
        setFormValues({ ...userData?.data?.user[0], language: languageArray, interest: interestArray });
    }
    useEffect(() => {
        if (!userData.success || userData?.data?.user?.length === 0) {
            setFormValues(null)
            return
        }
        updateUserData(userData);

    }, [userData]);


    useEffect(() => {
        setUserId(searchParams.get('userId'))

    }, [searchParams])

    return (
        <div className="pt-5">
            <Transition appear show={modal1} as={Fragment}>
                <Dialog as="div" open={modal1} onClose={() => setModal1(false)}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0" />
                    </Transition.Child>
                    <div className="fixed inset-0 z-[999] overflow-y-auto bg-[black]/60">
                        <div className="flex min-h-screen items-start justify-center px-4">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel as="div" className="panel my-8 w-full max-w-lg overflow-hidden rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <div className="text-lg font-bold">Are you Sure?</div>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModal1(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <p>
                                        Updating the user's information will permanently change their details. Take a moment to review the changes. Do you want to proceed? </p>
                                        <div className="mt-8 flex items-center justify-end">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => setModal1(false)}>
                                                Cancel
                                            </button>
                                            <button type="button" className="btn btn-primary ltr:ml-4 rtl:mr-4" onClick={handleConfirmUpdate}>
                                                Yes
                                            </button>
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
            <form className="mx-auto w-full mb-5" onSubmit={handleSearch}>
                <div className=' grid sm:grid-cols-2 md:grid-cols-3 gap-4'>

                    {/* User Id */}
                    <div className="relative">
                        <label>User Id</label>
                        <input
                            type="text"
                            value={userId}
                            placeholder="User Id ...."
                            name="userId"
                            className="form-input shadow-[0_0_4px_2px_rgb(31_45_61_/_10%)] bg-white rounded-full h-11 placeholder:tracking-wider ltr:pr-11 rtl:pl-11"
                            onChange={e => setUserId(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className='flex justify-center mt-2'>
                    <button className='bg-primary text-white p-2 font-bold rounded-md ' type='submit'>Search</button>
                </div>

            </form>


            {formValues ?
                <>
                    <div className="mb-5 flex items-center justify-between">
                        <h5 className="text-lg font-semibold dark:text-white-light">Partner Update Form for {process.env.NEXT_PUBLIC_APP_NAME}</h5>
                    </div>

                    <div>
                        <form
                            className="mb-5 rounded-md border border-[#ebedf2] bg-white p-4 dark:border-[#191e3a] dark:bg-black"
                            onSubmit={handleUpdate}
                            id="partner_form"
                        >
                            <h6 className="mb-5 text-lg font-bold">Existing Information</h6>
                            <div className="flex flex-col sm:flex-row">
                                <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="name">Full Name (Required)</label>
                                        <input
                                            id="name"
                                            type="text"
                                            placeholder={`Enter ${process.env.NEXT_PUBLIC_APP_NAME === "Sobhagya"
                                                ? "Astrologer"
                                                : "Partner"
                                                } Name`}
                                            className="form-input"
                                            required
                                            name="name"
                                            value={formValues?.name}
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="about">About</label>
                                        <textarea
                                            id="about"
                                            type="textarea"
                                            placeholder="About"
                                            className="form-textarea"
                                            name="about"
                                            value={formValues?.about}
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="videoRpm">Video Rpm (Required)</label>
                                        <input
                                            id="videoRpm"
                                            type="number"
                                            placeholder="Video rate/min"
                                            className="form-input"
                                            min={0}
                                            step={"0.01"}
                                            required
                                            name="videoRpm"
                                            value={formValues?.videoRpm}
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                            onWheel={numberInputOnWheelPreventChange}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="audioRpm">Audio Rpm (Required)</label>
                                        <input
                                            id="rpm"
                                            type="number"
                                            placeholder="Audio rate/min"
                                            className="form-input"
                                            min={0}
                                            step={"0.01"}
                                            required
                                            name="rpm"
                                            value={formValues?.rpm}
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                            onWheel={numberInputOnWheelPreventChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="payoutVideoRpm">Payout Video Rpm (Required)</label>
                                        <input
                                            id="payoutVideoRpm"
                                            type="number"
                                            placeholder="Payout Video rate/min"
                                            className="form-input"
                                            min={0}
                                            step={"0.01"}
                                            required
                                            name="payoutVideoRpm"
                                            value={formValues?.payoutVideoRpm}
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                            onWheel={numberInputOnWheelPreventChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="payoutAudioRpm">Payout Audio Rpm (Required)</label>
                                        <input
                                            id="payoutAudioRpm"
                                            type="number"
                                            placeholder="Payout Audio rate/min"
                                            className="form-input"
                                            min={0}
                                            step={"0.01"}
                                            required
                                            name="payoutAudioRpm"
                                            value={formValues?.payoutAudioRpm}
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                            onWheel={numberInputOnWheelPreventChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="role">Role (Required)</label>
                                        <select
                                            id="role"
                                            className="form-select text-white-dark"
                                            name="role"
                                            defaultValue="friend"
                                            value={formValues?.role}
                                            required
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                        >
                                            <option value="friend">Friend</option>
                                            <option value="user">User</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="phone">Phone (Required)</label>
                                        <input
                                            id="phone"
                                            type="number"
                                            placeholder="Mobile Number"
                                            className={`form-input`}
                                            name="phone"
                                            required
                                            value={formValues?.phone}
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                            onWheel={numberInputOnWheelPreventChange}
                                        />
                                        
                                    </div>
                                    <div>
                                        <label htmlFor="age">Age</label>
                                        <input
                                            id="age"
                                            type="number"
                                            placeholder="Age"
                                            className="form-input"
                                            name="age"
                                            value={formValues?.age}
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                            onWheel={numberInputOnWheelPreventChange}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="language">Language (Required)</label>
                                        <Asyncselect
                                            isMulti
                                            cacheOptions
                                            defaultOptions
                                            loadOptions={promiseOptionsLanguages}
                                            name="language"
                                            id="language"
                                            value={formValues?.language}
                                            required
                                            onChange={(e) => setFormValues({ ...formValues, language: e.value })}

                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="interest">Interests (Required)</label>
                                        <Asyncselect
                                            isMulti
                                            cacheOptions
                                            defaultOptions
                                            loadOptions={promiseOptionsInterests}
                                            name="interest"
                                            id="interest"
                                            value={formValues.interest}
                                            onChange={(e) => setFormValues({ ...formValues, interest: e.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="avatar">Avatar or Image (Required)</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            name="avatar"
                                            id="avatar"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="sample">Sample Audio {process.env.NEXT_PUBLIC_APP_NAME !== "Sobhagya" ? "(Required)" : ""}</label>
                                        <input type="file" accept="audio/*" name="sample" id="audio" />
                                    </div>

                                    <div>
                                        <label htmlFor="custom_switch_checkbox1">Video Call Admin</label>
                                        <div className="w-12 h-6 relative">
                                            <input
                                                type="checkbox"
                                                className="custom_switch absolute w-full h-full opacity-0 z-10 cursor-pointer peer form-checkbox"
                                                id="isVideoCallAllowedAdmin"
                                                name="isVideoCallAllowedAdmin"
                                                checked={formValues?.isVideoCallAllowedAdmin}
                                                onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.checked })}
                                            />
                                            <span className="outline_checkbox bg-icon border-2 border-[#ebedf2] dark:border-white-dark block h-full rounded-full before:absolute before:left-1 before:bg-[#ebedf2] dark:before:bg-white-dark before:bottom-1 before:w-4 before:h-4 before:rounded-full before:bg-[url(/assets/images/close.svg)] before:bg-no-repeat before:bg-center peer-checked:before:left-7 peer-checked:before:bg-[url(/assets/images/checked.svg)] peer-checked:border-primary peer-checked:before:bg-primary before:transition-all before:duration-300"></span>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="custom_switch_checkbox1">Video Call</label>
                                        <div className="w-12 h-6 relative">
                                            <input
                                                type="checkbox"
                                                className="custom_switch absolute w-full h-full opacity-0 z-10 cursor-pointer peer form-checkbox"
                                                id="isVideoCallAllowed"
                                                name="isVideoCallAllowed"
                                                checked={formValues?.isVideoCallAllowed}
                                                onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.checked })}
                                            />
                                            <span className="outline_checkbox bg-icon border-2 border-[#ebedf2] dark:border-white-dark block h-full rounded-full before:absolute before:left-1 before:bg-[#ebedf2] dark:before:bg-white-dark before:bottom-1 before:w-4 before:h-4 before:rounded-full before:bg-[url(/assets/images/close.svg)] before:bg-no-repeat before:bg-center peer-checked:before:left-7 peer-checked:before:bg-[url(/assets/images/checked.svg)] peer-checked:border-primary peer-checked:before:bg-primary before:transition-all before:duration-300"></span>
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="status">Status (Required)</label>
                                        <Select
                                            options={statusOptions}
                                            placeholder="Status"
                                            name="status"
                                            required
                                            defaultValue={statusOptions[0]}
                                            value={{ value: formValues?.status, label: formValues?.status }}
                                            onChange={(e) => setFormValues({ ...formValues, status: e.value })}
                                        />
                                    </div>

                                    <div>
                                        <label>Upi Id (Required)</label>
                                        <input
                                            id="upiId"
                                            type="text"
                                            placeholder="Upi Id"
                                            className={`form-input ${adminData?.permissions?.updatePaymentDetails === false && 'bg-gray-100'}`}
                                            name="upi"
                                            value={formValues?.upi}
                                            onChange={(e) => setFormValues({ ...formValues, [e.target.name]: e.target.value })}
                                            required={adminData?.permissions?.updatePaymentDetails}
                                            disabled={adminData?.permissions?.updatePaymentDetails === false ? true : false}
                                        />
                                    </div>
                                    <div className="mt-3 sm:col-span-2">
                                        <button type="submit" className="btn btn-primary">
                                            Update
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div>
                        <Link href={`/calls?receiverId=` + userId} className='btn btn-info w-36'>Call History</Link>
                    </div>
                </>
                :
                <div className='text-center font-bold'>
                    {userId ?
                        "No user exists with this User Id"
                        : "Enter UserId to update"
                    }
                </div>
            }
        </div>
    );
};

export default ComponentUpdateNormalUser;
