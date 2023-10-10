CREATE OR REPLACE FUNCTION random_between(low INT ,high INT) 
   RETURNS INT AS
$$
BEGIN
   RETURN floor(random()* (high-low + 1) + low);
END;
$$ language 'plpgsql' STRICT;

create table if not exists public.cities
(
    id   bigserial,
    name varchar(255)
);

create table if not exists public.forecast
(
    id          bigserial,
    "cityId"    bigint,
    "dateTime"  bigint,
    temperature integer,
    summary     text
);

INSERT INTO "public"."cities" ("name") VALUES ('Moscow'), ('Ryazan'), ('Krasnodar'), ('Vladikavkaz'), ('Sochi'), ('Samara'), ('Volgograd'), ('Novosibirsk'), ('Vladivostok'), ('Kostroma');

INSERT INTO "public"."forecast" ("cityId", "dateTime", "temperature", "summary") 
SELECT
   random_between(1,10), extract(epoch from (now() - random() * INTERVAL '10 days'))::integer, random_between(8,15), (array['Sunny','Fair','Cloudy','Showers','Squalls','Thunderstorms','Drizzle'])[floor(random() * 7 + 1)]
FROM generate_series(1, 10000);

