'use client'

import { Fragment, useEffect, useState } from "react";
import Cookies from "universal-cookie";
import { get, post } from "@/utils";
import ComponentsBannersTable from '@/components/banners/component-banners-table';
import { Dialog, Transition } from "@headlessui/react";
import IconX from "../icon/icon-x";

function ComponentBannerManager() {
    const cookies = new Cookies(null, { path: '/' })
    const [addBtnModal, setAddBtnModal] = useState(false);
    const [banner,setBanner]=useState({
        title:'',
        index:'',
        type:'top'
    });
    useEffect(() => {
        const access_token = cookies.get('access_token')
        get('/user/api/admin/get-banners-list', access_token)
            // .then(res=>res.json)
            .then(res => console.log(res))
            .catch(err => console.log(err));
    }, [])

    const handleAddBanner = (e) => {
        e.preventDefault();
        try{  
            
            post("/user/api/admin/add-banner",cookies.get('access_token'),banner)
        }catch(err){

        }
    }


    return (
        <>  


        {/* Modal  */}
        <Transition appear show={addBtnModal} as={Fragment}>
                <Dialog as="div" open={addBtnModal} onClose={() => setAddBtnModal(false)}>
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
                                <Dialog.Panel as="div" className="panel my-8 w-full max-w-lg rounded-lg border-0 p-0 text-black dark:text-white-dark">
                                    <div className="flex items-center justify-between bg-[#fbfbfb] px-5 py-3 dark:bg-[#121c2c]">
                                        <button type="button" className="text-white-dark hover:text-dark" onClick={() => setAddBtnModal(false)}>
                                            <IconX />
                                        </button>
                                    </div>
                                    <form className="p-5" onSubmit={handleAddBanner}>
                                        <div className='flex flex-col'>

                                            <label className="inline-flex">
                                                <input type="text" className="form-input text-dark outline-success" name={'title'} placeholder="Banner Name"
                                                    // value={banner?.title}
                                                    // onChange={(e)=>setBanner({...banner,title:e.target.value})}
                                                />
                                            </label>
                                            <label className="inline-flex">
                                                <input type="number" min='0' className="form-input text-dark outline-success" name={'index'} placeholder="Banner Index"
                                                    // value={banner?.index}
                                                    // onChange={(e)=>setBanner({...banner,index:e.target.value})}
                                                />
                                            </label>
                                            
                                            <label className="inline-flex">
                                                <input type="text" className="form-input text-dark outline-success disabled:bg-gray-100" name={'type'} placeholder="Banner Type" disabled
                                                    // value={banner?.type}
                                                />
                                            </label>
                                            
                                        </div>

                                        <div className="mt-8 flex items-center justify-end">
                                            <button type="button" className="btn btn-outline-danger" onClick={() => {
                                                setBanner(null)
                                                setAddBtnModal(false)
                                            }}>
                                                Cancel
                                            </button>
                                            <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" >
                                                Add
                                            </button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        <div className="flex justify-endt">
            <button className="btn-primary btn " onClick={() => setAddBtnModal(true)}>Add New</button>
        </div>
       
        <ComponentsBannersTable/>
        </>
    );
}

export default ComponentBannerManager;




