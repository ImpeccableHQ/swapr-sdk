import { AddressZero } from '@ethersproject/constants'
import { Provider } from '@ethersproject/providers'

import { ChainId, TradeType } from '../../../constants'
import { Token } from '../../token'
import { ZeroXTrade } from '../0x'
import { CurveTrade } from '../curve'
import { CoWTrade } from '../gnosis-protocol'
import { Trade } from '../interfaces/trade'
import { RoutablePlatform } from '../routable-platform'
import { UniswapTrade } from '../uniswap'
import { getAllCommonUniswapV2Pairs, UniswapV2Trade } from '../uniswap-v2'
// Types
import {
  EcoRouterBestExactInParams,
  EcoRouterBestExactOutParams,
  EcoRouterResults,
  EcoRouterSourceOptionsParams,
} from './types'
import { getUniswapV2PlatformList, sortTradesByExecutionPrice } from './utils'

/**
 * Low-level function to fetch from Eco Router sources
 * @returns {Promise<EcoRouterResults>} List of unsorted trade sources
 */
export async function getExactIn(
  { currencyAmountIn, currencyOut, maximumSlippage, receiver = AddressZero, user }: EcoRouterBestExactInParams,
  { uniswapV2 }: EcoRouterSourceOptionsParams,
  provider?: Provider
): Promise<EcoRouterResults> {
  // Error list
  const errors: any[] = []
  // Derive the chainId from the token in or out
  const chainId = (currencyAmountIn.currency as Token).chainId ?? (currencyOut as Token).chainId

  if (!chainId) {
    return {
      errors: [new Error('Unsupported chain')],
      trades: [],
    }
  }

  // Uniswap V2
  // Get the list of Uniswap V2 platform that support current chain
  const uniswapV2PlatformList = getUniswapV2PlatformList(chainId)

  const uniswapV2TradesList = uniswapV2PlatformList.map(async (platform) => {
    try {
      const getAllCommonUniswapV2PairsParams = {
        currencyA: currencyAmountIn.currency,
        currencyB: currencyOut,
        platform,
        provider,
      }

      const pairs = await getAllCommonUniswapV2Pairs(getAllCommonUniswapV2PairsParams)

      return (
        UniswapV2Trade.computeTradesExactIn({
          currencyAmountIn,
          currencyOut,
          maximumSlippage,
          maxHops: {
            maxHops: uniswapV2.useMultihops ? 3 : 1,
            maxNumResults: 1,
          },
          pairs,
        })[0] ?? undefined
      )
    } catch (error) {
      errors.push(error)
      return undefined
    }
  })

  const uniswapTrade = new Promise<UniswapTrade | undefined>((resolve) => {
    if (!RoutablePlatform.UNISWAP.supportsChain(chainId)) {
      return resolve(undefined)
    }

    UniswapTrade.getQuote({
      quoteCurrency: currencyOut,
      amount: currencyAmountIn,
      maximumSlippage,
      recipient: receiver,
      tradeType: TradeType.EXACT_INPUT,
    })
      .then((res) => resolve(res ? res : undefined))
      .catch((error) => {
        console.error(error)
        errors.push(error)
        resolve(undefined)
      })
  })

  // Curve
  const curveTrade = new Promise<CurveTrade | undefined>(async (resolve) => {
    if (!RoutablePlatform.CURVE.supportsChain(chainId)) {
      return resolve(undefined)
    }

    CurveTrade.bestTradeExactIn({
      currencyAmountIn,
      currencyOut,
      maximumSlippage,
      receiver,
    })
      .then(resolve)
      .catch((error) => {
        errors.push(error)
        resolve(undefined)
      })
  })

  // ZeroX
  const zeroXTrade = new Promise<ZeroXTrade | undefined>(async (resolve) => {
    if (!RoutablePlatform.ZEROX.supportsChain(chainId)) {
      return resolve(undefined)
    }

    ZeroXTrade.bestTradeExactIn(currencyAmountIn, currencyOut, maximumSlippage)
      .then(resolve)
      .catch((error) => {
        errors.push(error)
        resolve(undefined)
        console.error(error)
      })
  })

  // Gnosis Protocol V2
  const gnosisProtocolTrade = new Promise<CoWTrade | undefined>(async (resolve) => {
    if (!RoutablePlatform.COW.supportsChain(chainId as ChainId)) {
      return resolve(undefined)
    }

    CoWTrade.bestTradeExactIn({
      currencyAmountIn,
      currencyOut,
      maximumSlippage,
      receiver,
      user,
    })
      .then(resolve)
      .catch((error) => {
        resolve(undefined)
        console.error(error)
      })
  })

  // Wait for all promises to resolve, and
  // remove undefined values
  const unsortedTradesWithUndefined = await Promise.all<Trade | undefined>([
    ...uniswapV2TradesList,
    curveTrade,
    gnosisProtocolTrade,
    uniswapTrade,
    zeroXTrade,
  ])
  const unsortedTrades = unsortedTradesWithUndefined.filter((trade): trade is Trade => !!trade)

  // Return the list of sorted trades
  return {
    errors,
    trades: sortTradesByExecutionPrice(unsortedTrades),
  }
}

/**
 * Low-level function to fetch from Eco Router sources
 * @returns {Promise<EcoRouterResults>} List of unsorted trade sources
 */
export async function getExactOut(
  { currencyAmountOut, currencyIn, maximumSlippage, receiver = AddressZero, user }: EcoRouterBestExactOutParams,
  { uniswapV2 }: EcoRouterSourceOptionsParams,
  provider?: Provider
): Promise<EcoRouterResults> {
  // Error list
  const errors: any[] = []
  // Derive the chainId from the token in or out
  const chainId = (currencyAmountOut.currency as Token).chainId ?? (currencyIn as Token).chainId

  if (!chainId) {
    return {
      errors: [new Error('Unsupported chain')],
      trades: [],
    }
  }

  // Uniswap V2
  // Get the list of Uniswap V2 platform that support current chain
  const uniswapV2PlatformList = getUniswapV2PlatformList(chainId)

  const uniswapV2TradesList = uniswapV2PlatformList.map(async (platform) => {
    try {
      const getAllCommonUniswapV2PairsParams = {
        currencyA: currencyAmountOut.currency,
        currencyB: currencyIn,
        platform,
        provider,
      }

      const pairs = await getAllCommonUniswapV2Pairs(getAllCommonUniswapV2PairsParams)

      return (
        UniswapV2Trade.computeTradesExactOut({
          currencyAmountOut,
          currencyIn,
          maximumSlippage,
          maxHops: {
            maxHops: uniswapV2.useMultihops ? 3 : 1,
            maxNumResults: 1,
          },
          pairs,
        })[0] ?? undefined
      )
    } catch (error) {
      errors.push(error)
      return undefined
    }
  })

  // Uniswap v2 and v3
  const uniswapTrade = new Promise<UniswapTrade | undefined>((resolve) => {
    if (!RoutablePlatform.UNISWAP.supportsChain(chainId)) {
      return resolve(undefined)
    }

    UniswapTrade.getQuote({
      quoteCurrency: currencyIn,
      amount: currencyAmountOut,
      maximumSlippage,
      recipient: receiver,
      tradeType: TradeType.EXACT_OUTPUT,
    })
      .then((res) => resolve(res ? res : undefined))
      .catch((error) => {
        console.error(error)
        errors.push(error)
        resolve(undefined)
      })
  })

  // Curve
  const curveTrade = new Promise<CurveTrade | undefined>(async (resolve) => {
    if (!RoutablePlatform.CURVE.supportsChain(chainId)) {
      return resolve(undefined)
    }

    CurveTrade.bestTradeExactOut({
      currencyAmountOut,
      currencyIn,
      maximumSlippage,
      receiver,
    })
      .then(resolve)
      .catch((error) => {
        errors.push(error)
        resolve(undefined)
      })
  })

  // ZeroX
  const zeroXTrade = new Promise<ZeroXTrade | undefined>(async (resolve) => {
    if (!RoutablePlatform.ZEROX.supportsChain(chainId)) {
      return resolve(undefined)
    }

    ZeroXTrade.bestTradeExactOut(currencyIn, currencyAmountOut, maximumSlippage)
      .then(resolve)
      .catch((error) => {
        errors.push(error)
        resolve(undefined)
        console.error(error)
      })
  })

  // Gnosis Protocol V2
  const gnosisProtocolTrade = new Promise<CoWTrade | undefined>(async (resolve) => {
    if (!RoutablePlatform.GNOSIS_PROTOCOL.supportsChain(chainId as ChainId)) {
      return resolve(undefined)
    }

    CoWTrade.bestTradeExactOut({
      currencyAmountOut,
      currencyIn,
      maximumSlippage,
      receiver,
      user,
    })
      .then(resolve)
      .catch((error) => {
        resolve(undefined)
        console.error(error)
      })
  })

  // Wait for all promises to resolve, and
  // remove undefined values
  const unsortedTradesWithUndefined = await Promise.all<Trade | undefined>([
    ...uniswapV2TradesList,
    curveTrade,
    gnosisProtocolTrade,
    uniswapTrade,
    zeroXTrade,
  ])
  const unsortedTrades = unsortedTradesWithUndefined.filter((trade): trade is Trade => !!trade)

  // Return the list of sorted trades
  return {
    errors,
    trades: sortTradesByExecutionPrice(unsortedTrades),
  }
}
