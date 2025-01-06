'use client';
import { getUserInterests, userOnboardingApi } from '@/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Select from 'react-select';
import Asyncselect from 'react-select/async'
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Cookies from 'universal-cookie';

const ComponentPartnerOnboarding = () => {
    const cookies = new Cookies(null, { path: '/' });
    const MySwal = withReactContent(Swal);
    const [disableSubmit, setDisableSubmit] = useState(false);
    const {refresh}=useRouter();
    const statusOptions = [
        { value: 'online', label: 'Online' },
        { value: 'offline', label: 'Offline' },
        { value: 'ogbusy', label: 'Busy' }
    ]
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(disableSubmit) return;
        const formData = new FormData(e.target)
        if (formData.get('isVideoCallAllowed') === 'on') formData.set('isVideoCallAllowed', true)
        if (formData.get('isVideoCallAllowedAdmin') === 'on') formData.set('isVideoCallAllowedAdmin', true)

        formData.append('password', "Sarthak1singhal@");
        setDisableSubmit(true);
        const apiData = await userOnboardingApi('/auth/api/team/add-people', formData, cookies.get('access_token'))
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
            document.getElementById('partner_form').reset()
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
        setTimeout(() => {
            setDisableSubmit(false);
        },3000)
    }

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

    return (
        <div className="pt-5">
            <div className="mb-5 flex items-center justify-between">
                <h5 className="text-lg font-semibold dark:text-white-light">Partner Onboarding Form for {process.env.NEXT_PUBLIC_APP_NAME}</h5>
            </div>
            <div>
                <form
                    className="mb-5 rounded-md border border-[#ebedf2] bg-white p-4 dark:border-[#191e3a] dark:bg-black"
                    onSubmit={handleSubmit}
                    id="partner_form"
                >
                    <h6 className="mb-5 text-lg font-bold">General Information</h6>
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
                                    required
                                >
                                    <option value="friend">Friend</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="phone">Phone (Required)</label>
                                <input
                                    id="phone"
                                    type="number"
                                    placeholder="Mobile Number"
                                    className="form-input"
                                    name="phone"
                                    required
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
                                    required
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
                                />
                            </div>

                            <div>
                                <label>Upi Id (Required)</label>
                                <input
                                    id="upiId"
                                    type="text"
                                    placeholder="Upi Id"
                                    className="form-input"
                                    name="upi"
                                    required
                                />
                            </div>
                            <div className="mt-3 sm:col-span-2">
                                <button type="submit" className="btn btn-primary" disabled={disableSubmit}>
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

        </div>
    );
};

export default ComponentPartnerOnboarding;
