import { Contract, Wallet, ZeroAddress, type ContractTransaction } from 'npm:ethers'
import "jsr:@std/dotenv/load";
import { parseArgs } from "jsr:@std/cli/parse-args";
import { abi } from './otto.abi.ts'
import { base } from "./rpc.ts";
import { xcall } from "./lifi.api.ts";
import { ChainId } from "@lifi/types";
import { parseEther } from "ethers";

const PAYMENT_TERMINAL = '0x1d9619e10086fdc1065b114298384aae3f680cc0'

type Pay = {
  _projectId: bigint,
  _amount: bigint,
  _token: string,
  _beneficiary: string,
  _minReturnedTokens: bigint,
  _preferClaimedTokens: boolean,
  _memo: string,
  _metadata: string
}

const pay = (call: Pay): Promise<ContractTransaction> =>
  new Contract(PAYMENT_TERMINAL, abi)
    .pay
    .populateTransaction(...Object.values(call))

if (import.meta.main) {
  const flags = parseArgs(Deno.args, {
    string: [
      'project-id',
      'memo',
      'metadata',
      'amount',
      'minReturnedTokens'
    ],
    boolean: ['preferClaimedTokens'],
    default: {
      payInToken: ZeroAddress,
      memo: '',
      metadata: '0x00',
      minReturnedTokens: '0',
      preferClaimedTokens: false
    }
  })

  if (flags["project-id"] === undefined) throw new Error(`Please provide a --project-id`)
  const contributeAmtEth = parseEther('0.0001')
  const wallet = new Wallet(Deno.env.get('PK')!, base())
  const payParams: Pay = {
    _projectId: BigInt(flags["project-id"]),
    _amount: BigInt(contributeAmtEth),
    _token: ZeroAddress,
    _beneficiary: wallet.address,
    _minReturnedTokens: BigInt(flags.minReturnedTokens),
    _preferClaimedTokens: flags.preferClaimedTokens,
    _memo: flags.memo,
    _metadata: flags.metadata
  }
  const call = await pay(payParams)

  console.log(`Paying: ${flags.projectId}`)
  console.log(`Wrapping in lifi x-chain step...`)

  const wrappedCall = await xcall({
    fromAddress: wallet.address,
    toAmount: payParams._amount.toString(),
    fromChain: ChainId.BAS,
    toChain: ChainId.ETH,
    // ANON on BASE
    fromToken: '0x15e1129f628c5ff2fd0cb9e8e4923d467d30553d',
    toToken: payParams._token,
    contractCalls: [{
      fromAmount: payParams._amount.toString(),
      fromTokenAddress: ZeroAddress,
      toContractAddress: call.to,
      toContractCallData: call.data,
      toContractGasLimit: '200000'
    }]
  })

  // Expensive much
  //await wallet.sendTransaction(call)

  console.log(wrappedCall)
}
