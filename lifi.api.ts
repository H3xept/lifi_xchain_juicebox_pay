import { ContractCallsQuoteRequest } from '@lifi/types'

const url = 'https://li.quest/v1/quote/contractCalls';
const options = {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' }
};

export const xcall = (params: ContractCallsQuoteRequest) =>
    fetch(url, { ...options, body: JSON.stringify(params) })
        .then(res => res.json())
        .then(json => console.log(json))
        .catch(err => console.error(err));