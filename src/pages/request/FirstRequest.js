import { useEffect } from 'react';
import axios from 'axios';

const url = 'https://x8ki-letl-twmt.n7.xano.io/api:WVrFdUAc/cassandra_leaves';

const FirstRequest = () => {
    const fetchData = async () => {
        try {
            const response = await axios(url);
            const data = response.data;
            console.log(data);
        } catch (error) {
            console.log(error.response);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    return <h2 className='text-center'>first request</h2>;
};
export default FirstRequest;