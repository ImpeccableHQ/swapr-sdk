import { JsonRpcProvider } from '@ethersproject/providers'
import invariant from 'tiny-invariant'

import { ChainId } from '../../constants'
import { Currency } from '../currency'
import { CurrencyAmount } from '../fractions/currencyAmount'
import { TokenAmount } from '../fractions/tokenAmount'
import { Token } from '../token'

/**
 * Same as `wrappedCurrency` util functiom, but for `TokenAmount`
 * @param currencyAmount The currency amount to wrap
 * @param chainId The chain ID
 * @returns The wrapped currency amount if it is native, otherwise the currency itself
 * @throws an error
 */
export function wrappedAmount(currencyAmount: CurrencyAmount, chainId: ChainId): TokenAmount {
  if (currencyAmount instanceof TokenAmount) return currencyAmount
  if (Currency.isNative(currencyAmount.currency))
    return new TokenAmount(Token.getNativeWrapper(chainId), currencyAmount.raw)
  invariant(false, 'CURRENCY')
}

/**
 * Returns the wrapped currency for the given currency if it is native
 * @param currency The currency to wrap
 * @param chainId The chain ID
 * @returns The wrapped currency if it is native, otherwise the currency itself
 * @throws an error
 */
export function wrappedCurrency(currency: Currency, chainId: ChainId): Token {
  if (currency instanceof Token) return currency
  if (Currency.isNative(currency)) return Token.getNativeWrapper(chainId)
  invariant(false, 'CURRENCY')
}

/**
 * Attempts to find the chain ID of the given currencies
 * @param currencyAmount The currency amount to find the chain ID for
 * @param currency The currency to find the chain ID for
 * @returns
 */
export function tryGetChainId(currencyAmount: CurrencyAmount, currency: Currency) {
  return currencyAmount instanceof TokenAmount
    ? currencyAmount.token.chainId
    : currency instanceof Token
    ? currency.chainId
    : undefined
}

/**
 * List of RPC provider URLs for different chains.
 * @see https://chainlist.org/ lookup Chain info
 */
/**
 * @TODO in https://linear.app/swaprdev/issue/SWA-65/provide-a-single-source-of-truth-for-chain-rpcs-from-the-sdk
 * Make `RPC_PROVIDER_LIST` exportable from this repo
 */
export const RPC_PROVIDER_LIST: Record<ChainId, string> = {
  [ChainId.MAINNET]: 'https://mainnet.infura.io/v3/e1a3bfc40093494ca4f36b286ab36f2d',
  [ChainId.XDAI]: 'https://poa-xdai.gateway.pokt.network/v1/lb/627cd67433e8770039fe3dba',
  [ChainId.RINKEBY]: 'https://rinkeby.infura.io/v3/e1a3bfc40093494ca4f36b286ab36f2d',
  [ChainId.ARBITRUM_ONE]: 'https://arb1.arbitrum.io/rpc',
  [ChainId.ARBITRUM_RINKEBY]: 'https://rinkeby.arbitrum.io/rpc',
  [ChainId.ARBITRUM_GOERLI]: 'https://goerli-rollup.arbitrum.io/rpc',
  [ChainId.POLYGON]: 'https://polygon-rpc.com',
  [ChainId.GOERLI]: 'https://goerli.infura.io/v3/e1a3bfc40093494ca4f36b286ab36f2d',
  [ChainId.OPTIMISM_MAINNET]: 'https://opt-mainnet.g.alchemy.com/v2/6cRVjVO2uOTC9gWFCsBnquUwOM9zuWQZ',
  [ChainId.OPTIMISM_GOERLI]: 'https://goerli.optimism.io',
  [ChainId.BSC_MAINNET]: 'https://bsc-dataseed1.binance.org/',
  [ChainId.BSC_TESTNET]: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  [ChainId.ZK_SYNC_ERA_MAINNET]: 'https://mainnet.era.zksync.io',
  [ChainId.ZK_SYNC_ERA_TESTNET]: 'https://testnet.era.zksync.dev',
}

/**
 * Returns a RPC provider for the given chainId.
 * @param chainId The chainId
 * @returns The RPC provider
 */
export function getProvider(chainId: ChainId) {
  const host = RPC_PROVIDER_LIST[chainId]
  return new JsonRpcProvider(host)
}
