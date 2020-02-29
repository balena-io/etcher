for i in {a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p}; do
    dd if=/dev/zero bs=1M count=1500 of=/dev/sd$i &
done
wait
