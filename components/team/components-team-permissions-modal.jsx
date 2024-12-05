'use client';
import IconX from '@/components/icon/icon-x';
import { Transition, Dialog } from '@headlessui/react';
import React, { Fragment, useState } from 'react';
import { useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import {updateTeamMemberPermissions} from '@/utils'
import Cookies from 'universal-cookie';
import { useRouter } from 'next/navigation';
import { addUser } from '@/store/userSlice';
import { useDispatch } from 'react-redux';

const ComponentTeamPermissionModal = ({ permissions,userId }) => {
    const router=useRouter()
    const cookies=new Cookies(null, { path: '/' });
    const {data:userData}=useSelector(store=>store.user)
    const [updatedPermissions,setUpdatedPermissions]=useState(permissions)
    const dispatch=useDispatch();
    let permissionArr=[]
    for(let key in permissions){
        permissionArr.push({name:key, value:permissions[key]})
    }
    // console.log("🚀 ~ ComponentTeamPermissionModal ~ permissionArr:", permissionArr)
    const MySwal = withReactContent(Swal);
    const handlePermission=()=>{
        if(userData?.role?.toLowerCase()!=='admin') {
            MySwal.fire({
                title: 'You are not Authorized to do this action',
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                showCloseButton: true,
            });
        }
        else setModal2(true)
    }
    
    const handlChange=(e)=>{
        // console.log('checked e',e.target.checked)
        setUpdatedPermissions({...updatedPermissions,[e.target.name]:e.target.checked})
    }
    const handlePermissionsForm=async(e)=>{
        e.preventDefault()
        // console.log(updatedPermissions)

        // call api
        const responseData=await updateTeamMemberPermissions({userId,permissions:updatedPermissions,adminId:userData?._id},cookies)
        if(responseData.success){
            MySwal.fire({
                title: responseData.message,
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                showCloseButton: true,
                background:'green'
            });
            dispatch(addUser(responseData?.data))
            setModal2(false)
            router.refresh()
        }else{
            MySwal.fire({
                title: responseData.message,
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
                showCloseButton: true,
                background:'red'
            });
        }
        // console.log("🚀 ~ handlePermissionsForm ~ data:", responseData)
    }
    const [modal2, setModal2] = useState(false);
    return (
        <div>
            <div className="flex items-center justify-center">
                <button type="button" onClick={handlePermission} className="btn btn-danger">
                    Manage Permissions
                </button>
            </div>
            <Transition appear show={modal2} as={Fragment}>
                <Dialog as="div" open={modal2} onClose={() => setModal2(false)}>
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
                        <div className="flex min-h-screen items-center justify-center px-4">
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
                                        <h5 className="text-lg font-bold">Manage Permissions</h5>
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setModal2(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <div className="p-5">
                                        <form className='flex flex-col' onSubmit={handlePermissionsForm}>
                                            
                                            {permissionArr?.map((permission, index) => (
                                                <label key={index} className="inline-flex">
                                                    <input type="checkbox" className="form-checkbox rounded-full text-dark outline-success" checked={updatedPermissions[permission?.name]} value={permission?.value} name={permission?.name} onChange={handlChange}/>
                                                    <span>{permission?.name}</span>
                                                </label>
                                            ))}
                                            <div className="mt-8 flex items-center justify-end">
                                                <button type="button" className="btn btn-outline-danger" onClick={() => setModal2(false)}>
                                                    Discard
                                                </button>
                                                <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                                                    Update
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default ComponentTeamPermissionModal;
