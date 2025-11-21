// import "server-only";

export const CreditPlan = [
    {
        productId: "prod_57jrHygshD8viXHR4VifNo",
        points: 100,
        price: 12,
        productType: "once" as const,
    },
    {
        productId: "prod_4JScOFLNXf5F4I6QeppTTb",
        points: 200,
        price: 16.8,
        before: 24,
        discount: "30%",
        productType: "once" as const,
    },
    {
        // 一次性购买 送10积分
        productId: "prod_2Glu8D5pNSvUBPXUp7g1lp",
        points: 400,
        price: 31.2,
        before: 48,
        discount: "35%",
        productType: "once" as const,

    },
    {
        productId: "prod_3LIGt0PAjdkkwGvKj1tu8c",
        points: 1000,
        price: 72,
        before: 120,
        discount: "40%"

    }
]


export const SubscriptionPlan = [{
    productId: "prod_5dqZR5TqMSTUFF1TFUvKRu",
    points: 1200,
    type: "ultimate" as const,
    price: 39.99,
    before: 59.9,
    billingPeriod: "year" as const,
    productType: "subscription" as const,
},
{
    productId: "prod_6s3xp5gLoexYVwBdllYxh1",
    points: 80,
    type: "basic" as const,
    price: 4.99,
    billingPeriod: "year" as const,
    productType: "subscription" as const,
},

{
    productId: "prod_5WJ4Hf26iJyJmeFyKsmz9U",
    points: 600,
    type: "ultimate" as const,
    price: 39.99,
    before: 57.6,
    billingPeriod: "month" as const,
    productType: "subscription" as const,
},
{
    productId: "prod_5upKYMd9oHdy00ha69xDxl",
    points: 40,
    type: "basic" as const,
    price: 4.99,
    billingPeriod: "month" as const,
    productType: "subscription" as const,
},]




// export const CreditPlan = [
//     {
//         productId: "prod_Q5dDMCJs5jQVkzyptTCc5",
//         points: 100,
//         price: 12,
//         productType: "once" as const,
//     },
//     {
//         productId: "prod_3dZzNzC780DNAumOzqnunO",
//         points: 200,
//         price: 16.8,
//         before: 24,
//         discount: "30%",
//         productType: "once" as const,
//     },
//     {
//         // 一次性购买 送10积分
//         productId: "prod_6OPjeCZPv439J2UuXULran",
//         points: 400,
//         price: 31.2,
//         before: 48,
//         discount: "35%",
//         productType: "once" as const,

//     },
//     {
//         productId: "prod_6cA25LuVBSrMiDJ9XDAjun",
//         points: 1000,
//         price: 72,
//         before: 120,
//         discount: "40%"

//     }
// ]


// export const SubscriptionPlan = [{
//     productId: "prod_6bAvxhLyogUZx9yeTxqxew",
//     points: 1200,
//     type: "ultimate" as const,
//     price: 39.99,
//     before: 59.9,
//     billingPeriod: "year" as const,
//     productType: "subscription" as const,
// },
// {
//     productId: "prod_2NUAYWqwq5ikOOJvcMBnn0",
//     points: 80,
//     type: "basic" as const,
//     price: 4.99,
//     billingPeriod: "year" as const,
//     productType: "subscription" as const,
// },

// {
//     productId: "prod_2ALgG3xwHXo4ooT297E6Cq",
//     points: 600,
//     type: "ultimate" as const,
//     price: 39.99,
//     before: 57.6,
//     billingPeriod: "month" as const,
//     productType: "subscription" as const,
// },
// {
//     productId: "prod_69ut7714QfhUu0x1Nar0zl",
//     points: 40,
//     type: "basic" as const,
//     price: 4.99,
//     billingPeriod: "month" as const,
//     productType: "subscription" as const,
// },]