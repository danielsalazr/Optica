// export function getCookie(name) {
    
//     let cookieValue = null;

//     if (document.cookie && document.cookie !== '') {
//         const cookies = document.cookie.split(';');
//         for (let i = 0; i < cookies.length; i++) {
//             const cookie = cookies[i].trim();
//             // Does this cookie string begin with the name we want?
//             if (cookie.substring(0, name.length + 1) === (name + '=')) {
//                 cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
//                 break;
//             }
//         }
//     }
//     return cookieValue;
// }

  

  const script = document.createElement("script");
    // script.src = "https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/intlTelInput.min.js";
    script.async = true;
    // script.onload = () => {
    //     function getCookie(name) {
                
            
    //         let cookieValue = null;
        
    //         if (document.cookie && document.cookie !== '') {
    //             const cookies = document.cookie.split(';');
    //             for (let i = 0; i < cookies.length; i++) {
    //                 const cookie = cookies[i].trim();
    //                 // Does this cookie string begin with the name we want?
    //                 if (cookie.substring(0, name.length + 1) === (name + '=')) {
    //                     cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
    //                     break;
    //                 }
    //             }
    //         }
    //         return cookieValue;
    //       }

    // };
    document.body.appendChild(script);