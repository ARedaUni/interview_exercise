import { Test, TestingModule } from '@nestjs/testing';
import nock from 'nock';
import { UserService, IUserService } from './user.service';
import { UserCacheManagerService } from '../cache-manager/user-cache-manager.service';
import {
  ConfigurationManager,
  MockedConfigurationManager,
} from '../configuration/configuration-manager';
import { getEnv } from '../configuration/configuration';

const userObject = {
  id: '5fe0cce861c8ea54018385ae',
  firstName: 'Lance',
  lastName: 'Armstrong',
};
const userId = '5fe0cce861c8ea54018385ae';

class MockedUserCacheManagerService {
  getOrSet(userId: string, request: () => any) {
    return userObject;
  }
}

const user_service = process.env.USER_SERVICE_URL ?? 'http://localhost:1080' 
/*
replaced empty string with url
since url is not sensitive data here(environment variable appears 
to not exist even after trying dotenv to load them in main.ts or analysing 
configuration.ts file and modifying it. 
In a real scenario I would have just asked more senior engineers for help with 
debugging the environment variable issue.)
*/
describe('UserService', () => {
  let service: IUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: ConfigurationManager, useClass: MockedConfigurationManager },
        {
          provide: UserCacheManagerService,
          useClass: MockedUserCacheManagerService,
        },
      ],
      exports: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a userObject when calling request function correctly', async () => {
    nock(user_service)
      .get(`/api/v1/users/${userId}`)
      .reply(200, userObject);

    expect(await service.requestFunction(userId)).toEqual(userObject);
  });

  it('should return a userObject when calling getOrSet', async () => {
    expect(await service.getUser(userId)).toEqual(userObject);
  });

  it('should throw an error when the request fails ', async () => {
    nock(user_service)
      .get(`/api/v1/users/${userId}`)
      .reply(403);

    await expect(service.requestFunction(userId)).rejects.toThrow(
      new Error(
        'User Service request failed with error type: 403 and message: Forbidden',
      ),
    );
  });
});
