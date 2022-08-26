import { ChainId } from '../../../constants'
import { Fetcher } from '../../../fetcher'
import { Token } from '../../token'
import { CURVE_TOKENS, CurvePool, CurveToken, TOKENS_MAINNET, TokenType } from './tokens'

/**
 * Returns the token index of a token in a Curve pool
 * @param pool the Curve pool
 * @param tokenAddress the token address
 */
export function getTokenIndex(pool: CurvePool, tokenAddress: string, chainId: ChainId = ChainId.MAINNET) {
  // Combine all tokens without lpTokens
  const tokensWithoutLpToken = pool.tokens.filter((token) => token.isLPToken)

  // Use main tokens
  let tokenList = pool.tokens
  // Append underlying tokens
  const underlyingTokens = pool.underlyingTokens && (pool.underlyingTokens as CurveToken[])
  if (underlyingTokens) {
    tokenList = [...tokensWithoutLpToken, ...underlyingTokens]
  }
  // Append meta tokens
  else if (pool.isMeta && pool.metaTokens) {
    tokenList = [...tokensWithoutLpToken, ...(pool.metaTokens as CurveToken[])]
  }
  // Search for WETH in the pool
  const poolHasWETH = tokenList.find(
    ({ address }) => CURVE_TOKENS[chainId]?.weth?.address?.toLowerCase() === address.toLowerCase()
  )
  const poolHasEth = tokenList.find(
    ({ address }) => CURVE_TOKENS[chainId]?.eth?.address?.toLowerCase() === address.toLowerCase()
  )
  let tokenIndex

  // Case where both pool tokens and underlying tokens can be routed through
  if (underlyingTokens && pool.underlyingTokens?.length === pool.tokens.length) {
    tokenIndex = pool.tokens.findIndex(
      (item, index) =>
        item.address.toLowerCase() == tokenAddress.toLowerCase() ||
        underlyingTokens[index].address.toLowerCase() == tokenAddress.toLowerCase()
    )
  } else {
    // Search for the main/underlying token
    tokenIndex = tokenList.findIndex(({ address }) => address.toLowerCase() == tokenAddress.toLowerCase())
  }

  // ETH is always at 0 all pools
  if (tokenIndex < 0 && (poolHasWETH || poolHasEth)) {
    tokenIndex = 0
  }

  return tokenIndex
}

/**
 * Given a token, returns the token information if found otherwise returns token passed
 * @param token The token
 * @param chainId The chain ID. Default is Mainnet
 * @returns The token information or undefined if not found
 */
export function getCurveToken(token: Token, chainId: ChainId = ChainId.MAINNET) {
  const tokenList = CURVE_TOKENS[chainId as keyof typeof CURVE_TOKENS]

  return (
    Object.values(tokenList).find(({ address }) => address.toLowerCase() === token.address?.toLowerCase()) ||
    ({ ...token, type: 'other' } as CurveToken)
  )
}

/**
 *
 * @param pools The list of Curve pools
 * @param tokenInAddress Token in address
 * @param tokenOutAddress Token out address
 * @returns List of potential pools at which the trade can be done
 */
export async function getRoutablePools(
  pools: CurvePool[],
  tokenIn: CurveToken,
  tokenOut: CurveToken,
  chainId: ChainId,
  isTokenInNative: boolean,
  isTokenOutNative: boolean
) {
  const factoryPools = await Fetcher.fetchCurveFactoryPools(chainId)
  const allPools = pools.concat(factoryPools)
  return allPools.filter(({ tokens, metaTokens, underlyingTokens, allowsTradingETH, name }) => {
    let tokenInAddress = tokenIn.address
    let tokenOutAddress = tokenOut.address

    // For mainnet, account for ETH/WETH
    if (chainId === ChainId.MAINNET) {
      tokenInAddress = allowsTradingETH === true && isTokenInNative ? TOKENS_MAINNET.eth.address : tokenIn.address

      tokenOutAddress = allowsTradingETH === true && isTokenOutNative ? TOKENS_MAINNET.eth.address : tokenOut.address
    }
    if (
      // name === 'steth' ||
      name === 'Curve.fi Factory Plain Pool: stETH concentrated'
      // name === 'seth' ||
      // name === 'rETH' ||
      // name === 'crveth'
    ) {
      console.log('isTokenInNative', isTokenInNative)
      console.log('name', name)
      console.log('native in ', tokenInAddress)
      console.log('native out', tokenOutAddress)
      console.log('tokens', tokens)
      console.log('tokeninRaw', tokenIn.address)
      console.log('tokenOutRaw', tokenOut.address)
      console.log('allowsTraingEth', allowsTradingETH)
    }

    // main tokens

    const hasTokenIn = tokens.some((token) => token.address.toLowerCase() === tokenInAddress.toLowerCase())

    const hasTokenOut = tokens.some((token) => token.address.toLowerCase() === tokenOutAddress.toLowerCase())

    // Meta tokens in MetaPools [ERC20, [...3PoolTokens]]
    const hasMetaTokenIn = metaTokens?.some((token) => token.address.toLowerCase() === tokenInAddress.toLowerCase())
    const hasMetaTokenOut = metaTokens?.some((token) => token.address.toLowerCase() === tokenOutAddress.toLowerCase())

    // Underlying tokens, similar to meta tokens
    const hasUnderlyingTokenIn = underlyingTokens?.some(
      (token) => token.address.toLowerCase() === tokenInAddress.toLowerCase()
    )
    const hasUnderlyingTokenOut = underlyingTokens?.some(
      (token) => token.address.toLowerCase() === tokenOutAddress.toLowerCase()
    )

    return (
      (hasTokenIn || hasUnderlyingTokenIn || hasMetaTokenIn) &&
      (hasTokenOut || hasUnderlyingTokenOut || hasMetaTokenOut)
    )
  })
}

const usd = [
  'dai',
  'jpy',
  'aud',
  'dei',
  'home',
  'fiat',
  'alcx',
  'cad',
  'usx',
  'fei',
  'crv',
  'ust',
  'vst',
  'fxs',
  'fox',
  'cvx',
  'angle',
  'gamma',
  'apw',
  'usd',
  'mim',
  'frax',
  'apv',
  'rai',
  'eur',
  'gbp',
  'chf',
  'dola',
  'krw',
]
const btc = ['btc']
const eth = ['eth']

/**
 * Returns tokenType based on token symbol
 * @param symbol symbol of curve token
 * @returns token type of given symbol
 */

export function determineTokeType(symbol: string): TokenType {
  const symbolLowercased = symbol.toLocaleLowerCase()
  if (eth.includes(symbolLowercased)) return TokenType.ETH
  if (btc.includes(symbolLowercased)) return TokenType.BTC
  if (usd.includes(symbolLowercased)) return TokenType.USD
  else return TokenType.OTHER
}
