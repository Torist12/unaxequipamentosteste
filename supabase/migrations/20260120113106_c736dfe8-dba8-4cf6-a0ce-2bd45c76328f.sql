-- Add DELETE policy for transactions table to allow cascade delete
CREATE POLICY "Public delete transactions"
ON public.transactions
FOR DELETE
USING (true);