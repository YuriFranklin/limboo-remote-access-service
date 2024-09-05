import { Module, Global } from '@nestjs/common';
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  from,
  Observable,
} from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { AuthService } from 'src/auth/auth.service';
import { AuthModule } from 'src/auth/auth.module';

@Global()
@Module({
  providers: [
    AuthService,
    {
      provide: 'APOLLO_CLIENT',
      useFactory: async (authService: AuthService) => {
        const authLink = new ApolloLink((operation, forward) => {
          return new Observable((observer) => {
            authService
              .getAccessToken()
              .then((token) => {
                operation.setContext({
                  headers: {
                    authorization: `Bearer ${token}`,
                  },
                });
                const subscriber = forward(operation).subscribe({
                  next: (result) => observer.next(result),
                  error: (error) => observer.error(error),
                  complete: () => observer.complete(),
                });
                return () => subscriber.unsubscribe();
              })
              .catch((error) => {
                observer.error(error);
              });
          });
        });

        const httpLink = new HttpLink({
          uri: `http://${process.env.GRAPHQL_GATEWAY_HOST}/graphql`,
        });

        const errorLink = onError(({ networkError }) => {
          if (
            networkError &&
            'status' in networkError &&
            networkError.status === 401
          ) {
            // TODO: RETRY
          }
        });

        return new ApolloClient({
          link: from([errorLink, authLink, httpLink]),
          cache: new InMemoryCache(),
        });
      },
      inject: [AuthService],
    },
  ],
  exports: ['APOLLO_CLIENT'],
  imports: [AuthModule],
})
export class ApolloModule {}
