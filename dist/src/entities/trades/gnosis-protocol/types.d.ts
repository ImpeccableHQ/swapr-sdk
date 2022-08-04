import type { Order, OrderKind } from '@gnosis.pm/gp-v2-contracts/lib/esm/order';
import type { ChainId, TradeType } from '../../../constants';
import type { Currency } from '../../currency';
import type { CurrencyAmount } from '../../fractions/currencyAmount';
import type { Percent } from '../../fractions/percent';
import type { SigningSchemeValue } from './signatures';
export declare enum GnosisProtocolTradeOrderStatus {
    UNKNOWN = "unknown",
    PENDING = "pending",
    PRESIGNATURE_PENDING = "presignaturePending",
    FULFILLED = "fulfilled",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export interface GnosisProtocolTradeConstructorParams {
    inputAmount: CurrencyAmount;
    outputAmount: CurrencyAmount;
    maximumSlippage: Percent;
    tradeType: TradeType;
    chainId: ChainId;
    order: Order;
    fee?: Percent;
    feeAmount: CurrencyAmount;
}
export interface GnosisProtocolTradeBestTradeExactInParams {
    currencyAmountIn: CurrencyAmount;
    currencyOut: Currency;
    maximumSlippage: Percent;
    receiver?: string;
}
export interface GnosisProtocolTradeBestTradeExactOutParams {
    currencyAmountOut: CurrencyAmount;
    currencyIn: Currency;
    maximumSlippage: Percent;
    receiver?: string;
}
export declare type GnosisProtocolTradeSwapOrderParams = Required<Pick<Order, 'receiver'>>;
export declare type GnosisProtocolTradeOrder = Order;
export declare enum GnosisProtocolTradeOrderOrderStatus {
    UNKNOWN = "unknown",
    OPEN = "open",
    PRESIGNATURE_PENDING = "presignaturePending",
    FULFILLED = "fulfilled",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
export declare type GnosisProtocolTradeApiOrderOrderStatus = 'fulfilled' | 'expired' | 'cancelled' | 'presignaturePending' | 'open';
export interface GnosisProtocolTradeOrderMetadata {
    creationDate: string;
    owner: string;
    uid: string;
    availableBalance: string;
    executedBuyAmount: string;
    executedSellAmount: string;
    executedSellAmountBeforeFees: string;
    executedFeeAmount: string;
    invalidated: false;
    sellToken: string;
    buyToken: string;
    sellAmount: string;
    buyAmount: string;
    validTo: number;
    appData: number;
    feeAmount: string;
    kind: OrderKind;
    partiallyFillable: false;
    signature: string;
    signingScheme: SigningSchemeValue;
    status: GnosisProtocolTradeApiOrderOrderStatus;
    receiver: string;
}
