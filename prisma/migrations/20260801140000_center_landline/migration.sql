-- İkinci əlaqə nömrəsi: `phone` OTP üçün mobilə keçəndə köhnə şəhər/stasionar
-- nömrə itməsin deyə burada saxlanır.
ALTER TABLE "CenterProfile" ADD COLUMN IF NOT EXISTS "landlinePhone" TEXT;
