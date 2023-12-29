import { twx } from './utils';

const Card = twx.div`rounded-xl border bg-card text-card-foreground`;
Card.displayName = 'Card';

const CardHeader = twx.div`flex flex-col space-y-1.5 p-6`;
CardHeader.displayName = 'CardHeader';

const CardTitle = twx.div`font-semibold leading-none tracking-tight`;
CardTitle.displayName = 'CardTitle';

const CardDescription = twx.div`text-sm text-muted-foreground`;
CardDescription.displayName = 'CardDescription';

const CardContent = twx.div`p-6 pt-0`;
CardContent.displayName = 'CardContent';

const CardFooter = twx.div`flex items-center p-6 pt-0`;
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
