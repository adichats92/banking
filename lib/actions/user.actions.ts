'use server';

import { ID } from 'node-appwrite';
import { createAdminClient, createSessionClient } from '../appwrite';
import { cookies } from 'next/headers';
import { encryptId, extractCustomerIdFromUrl, parseStringify } from '../utils';
import exp from 'constants';
import {
	CountryCode,
	ProcessorTokenCreateRequest,
	ProcessorTokenCreateRequestProcessorEnum,
	Products,
} from 'plaid';
import { plaidClient } from '../plaid';
import { revalidatePath } from 'next/cache';
import { addFundingSource, createDwollaCustomer } from './dwolla.actions';

const {
	//Appwrite environment variables from .env
	APPWRITE_DATABASE_ID: DATABASE_ID,
	APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
	APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

export const signIn = async ({ email, password }: signInProps) => {
	//Sign in with Appwrite
	try {
		//Create session
		const { account } = await createAdminClient();

		const response = await account.createEmailPasswordSession(email, password);

		return parseStringify(response);
	} catch (error) {
		console.log('Error', error);
	}
};

export const signUp = async (userData: SignUpParams) => {
	//Sign up with Appwrite
	const { email, password, firstName, lastName } = userData;
	try {
		//Create user account

		let newUserAccount;

		const { account, database } = await createAdminClient();

		newUserAccount = await account.create(
			ID.unique(),
			email,
			password,
			`${firstName} ${lastName}`
		);

		if (!newUserAccount) throw Error('Error creating user account');

		const dwollaCustomerUrl = await createDwollaCustomer({
			...userData,
			type: 'personal',
		});

		if (!dwollaCustomerUrl) throw Error('Error creating Dwolla customer');

		const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

		const newUser = await database.updateDocument(
			DATABASE_ID!,
			USER_COLLECTION_ID!,
			ID.unique(),
			{
				...userData,
				$userId: newUserAccount.$id,
				dwollaCustomerId,
				dwollaCustomerUrl,
			}
		);

		//Create session
		const session = await account.createEmailPasswordSession(email, password);
		//Set session cookie
		cookies().set('appwrite-session', session.secret, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: true,
		});
		return parseStringify(newUser);
	} catch (error) {
		console.log('Error', error);
	}
};

export async function getLoggedInUser() {
	//Get user
	try {
		const { account } = await createSessionClient();
		const user = await account.get();
		return parseStringify(user);
	} catch (error) {
		return null;
	}
}

export const logoutAccount = async () => {
	//Logout user
	try {
		const { account } = await createSessionClient();
		await account.deleteSession('current');
		cookies().delete('appwrite-session');
		await account.deleteSession('current');
	} catch (error) {
		return null;
	}
};

export const createLinkToken = async (user: User) => {
	try {
		//Create token params
		const tokenParams = {
			user: {
				client_user_id: user.$id,
			},
			client_name: user.name,
			products: ['auth'] as Products[],
			language:
				'en de fr it es pt nl sv no da fi pl cs sk el hu ru uk tr ar he th id ms vi zh-CN ja ko hi bn en-GB fr-CA es-419 es-ES de-DE it-IT nl-NL nb-NO pl-PL pt-BR ru-RU sv-SE tr-TR zh-TW ko-KR en-CA en-AU es-MX zh-HK zh-SG en-IN es-AR en-GB es-ES fr-FR de-DE it-IT ja-JP pt-PT zh-Hans es-US',
			country_codes: [
				'AL',
				'AD',
				'AM',
				'AT',
				'BY',
				'BE',
				'BA',
				'BG',
				'HR',
				'CY',
				'CZ',
				'DK',
				'EE',
				'FI',
				'FR',
				'GE',
				'DE',
				'GR',
				'HU',
				'IS',
				'IE',
				'IT',
				'LV',
				'LI',
				'LT',
				'LU',
				'MT',
				'MD',
				'MC',
				'ME',
				'NL',
				'MK',
				'NO',
				'PL',
				'PT',
				'RO',
				'RU',
				'SM',
				'RS',
				'SK',
				'SI',
				'ES',
				'SE',
				'CH',
				'TR',
				'UA',
				'VA',
				'US',
				'GB',
				'CA',
				'AU',
				'NZ',
				'ZA',
			] as CountryCode[],
		};
		//Create link token
		const response = await plaidClient.linkTokenCreate(tokenParams);
		//Return link token
		return parseStringify({ linkToken: response.data.link_token });
	} catch (error) {
		console.log('Error', error);
	}
};

export const createBankAccount = async ({
	userId,
	bankId,
	accountId,
	accessToken,
	fundingSourceUrl,
	sharableId,
}: createBankAccountProps) => {
	//Create bank account document in Appwrite database collection for user
	try {
		const { database } = await createAdminClient();
		const bankAccount = await database.createDocument(
			DATABASE_ID!,
			BANK_COLLECTION_ID!,
			ID.unique(),
			{
				userId,
				bankId,
				accountId,
				accessToken,
				fundingSourceUrl,
				sharableId,
			}
		);
		return parseStringify(bankAccount);
	} catch (error) {
		console.log('Error', error);
	}
};

export const exchangePublicToken = async ({
	//Exchange public token for access token and create bank account document in Appwrite database collection for user
	publicToken,
	user,
}: exchangePublicTokenProps) => {
	try {
		//Exchange public token for access token and item id with Plaid API client instance
		const response = await plaidClient.itemPublicTokenExchange({
			public_token: publicToken,
		});
		//Get access token and item id from response data object from Plaid API
		const accessToken = response.data.access_token;
		const itemId = response.data.item_id;
		//Get account details from Plaid API
		const accountResponse = await plaidClient.accountsGet({
			access_token: accessToken,
		});
		//Get first account data from response data object from Plaid API
		const accountData = accountResponse.data.accounts[0];
		//Create processor token request object with access token and account id
		const request: ProcessorTokenCreateRequest = {
			access_token: accessToken,
			account_id: accountData.account_id,
			processor: 'dwolla' as ProcessorTokenCreateRequestProcessorEnum,
		};
		//Create processor token with Plaid API client instance and request object
		const processorTokenResponse = await plaidClient.processorTokenCreate(
			request
		);
		//Get processor token from response data object from Plaid API
		const processorToken = processorTokenResponse.data.processor_token;
		//Create funding source with Dwolla API client instance
		const fundingSourceUrl = await addFundingSource({
			dwollaCustomerId: user.dwollaCustomerId,
			processorToken,
			bankName: accountData.name,
		});
		//Throw error if no funding source url is returned
		if (!fundingSourceUrl) throw Error('Error creating funding source');
		//Create bank account document in Appwrite database collection for user with bank account data and funding source url
		await createBankAccount({
			userId: user.$id,
			bankId: itemId,
			accountId: accountData.account_id,
			accessToken,
			fundingSourceUrl,
			sharableId: encryptId(accountData.account_id),
		});
		//Revalidate path to update user data and bank account data
		revalidatePath('/');
		//Return success message if bank account is created successfully
		return parseStringify({
			publicTokenExchange: 'Complete',
		});
	} catch (error) {
		console.log('An error occurred while creating exchange token:', error);
	}
};
