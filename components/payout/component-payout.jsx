'use client'

import { post } from "@/utils";
import { useState } from "react"
import { useSelector } from "react-redux";
import Swal from 'sweetalert2';
import Cookies from 'universal-cookie';
import withReactContent from 'sweetalert2-react-content';


function ComponentPayout(){
    const [excelFile,setExcelFile]=useState(null);
    const {data:adminData} = useSelector(store => store?.user)
    const MySwal = withReactContent(Swal);
    const cookies = new Cookies(null, { path: '/' });
    const [modal1, setModal1] = useState(false);


    const handleUpload=async()=>{
        try{
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

            const formData = new FormData();
            formData.append('file', excelFile);

            const response = await axios.post(
                '/payment/api/admin/update-payout-details',
                formData,
                {
                  headers: {
                    Authorization: `Bearer ${cookies.get('access_token')}`,
                  },
                  responseType: 'blob',
                }
              );
              
              // Create a blob link to download
              const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // or .xls
              });
              const downloadUrl = window.URL.createObjectURL(blob);
              
              const a = document.createElement('a');
              a.href = downloadUrl;
              a.download = 'payout-details.xlsx'; // 🔥 Customize filename if needed
              document.body.appendChild(a);
              a.click(); // Auto-trigger download
              a.remove();
              window.URL.revokeObjectURL(downloadUrl); // Cleanup
        }catch(err){
            MySwal.fire({
                title: 'Error',
                text: err,
                icon: 'error',
                confirmButtonText: 'Ok',
            })
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
    return (
        <>
            <div className="mb-5">
             <h1 className="hover:underline text-xl text-center">Please make sure that Amount field exist with Amount_Id and UTR NO with UTR_NO in your excel file.</h1>
                <div className="custom-file-container text" data-upload-id="myFirstImage">
                    <input type="file" className="" accept="" onChange={(e) => setExcelFile(e.target.files[0])}/>
                    <button type="button" className="custom-file-container__button">
                        <span className="custom-file-container__button-text bg-primary text-white p-2 rounded">Upload</span>
                    </button>
                </div>
            </div>
        </>
    )
}


export default ComponentPayout